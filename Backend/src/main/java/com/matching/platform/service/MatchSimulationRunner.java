package com.matching.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.config.MatchingProperties;
import com.matching.platform.dto.algo.AgentApiResponse;
import com.matching.platform.dto.algo.ChatStartRequest;
import com.matching.platform.dto.algo.GenerateReportRequest;
import com.matching.platform.dto.algo.ModelRefreshRequest;
import com.matching.platform.dto.algo.RiskDetectRequest;
import com.matching.platform.entity.MatchRecord;
import com.matching.platform.entity.UserAgent;
import com.matching.platform.entity.UserDistill;
import com.matching.platform.mapper.MatchAgentMessageMapper;
import com.matching.platform.mapper.MatchRecordMapper;
import com.matching.platform.mapper.UserAgentMapper;
import com.matching.platform.mapper.UserDistillMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchSimulationRunner {

    private final MatchRecordMapper matchRecordMapper;
    private final MatchAgentMessageMapper matchAgentMessageMapper;
    private final MatchMessageWriter matchMessageWriter;
    private final AlgoService algoService;
    private final MatchingProperties matchingProperties;
    private final RestTemplate restTemplate;
    private final UserAgentMapper userAgentMapper;
    private final UserDistillMapper userDistillMapper;
    private final ObjectMapper objectMapper;

    @Async("matchTaskExecutor")
    public void simulate(String matchId, String agentIdA, String agentIdB) {
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        MatchRecord m0 = matchRecordMapper.findByMatchId(matchId);
        if (m0 == null || m0.getStatus() == null || m0.getStatus() != 1) {
            log.warn("匹配 {} 状态异常，跳过模拟", matchId);
            return;
        }
        if (matchAgentMessageMapper.countByMatchId(matchId) > 0) {
            log.warn("匹配 {} 已有消息，跳过模拟", matchId);
            return;
        }

        try {
            ensureAgentProfile(agentIdA);
            ensureAgentProfile(agentIdB);
        } catch (Exception e) {
            log.error("确保 agent profile 失败: {}", e.getMessage(), e);
            return;
        }

        String sessionId;
        try {
            sessionId = callAgentChatStart(matchId, agentIdA, agentIdB);
        } catch (Exception e) {
            log.error("调用 agent chat-start 失败: {}", e.getMessage(), e);
            return;
        }

        m0.setSessionId(sessionId);
        m0.setChatRound(matchingProperties.getSimulationRounds());
        matchRecordMapper.update(m0);

        List<Map<String, String>> chatRecords;
        try {
            chatRecords = fetchChatRecords(sessionId);
        } catch (Exception e) {
            log.error("获取对话记录失败: {}", e.getMessage(), e);
            return;
        }

        for (Map<String, String> msg : chatRecords) {
            String speaker = msg.getOrDefault("speaker", "agent_a");
            String content = msg.getOrDefault("content", "");
            matchMessageWriter.append(matchId, speaker, content);
        }

        if (chatRecords.size() >= 10) {
            try {
                runRiskDetect(sessionId, chatRecords);
            } catch (Exception e) {
                log.error("风险检测失败: {}", e.getMessage(), e);
            }
        }

        try {
            GenerateReportRequest gr = new GenerateReportRequest();
            gr.setMatchId(matchId);
            gr.setSessionId(sessionId);
            algoService.generateReport(gr);
        } catch (Exception e) {
            log.error("生成报告失败: {}", e.getMessage(), e);
        }
    }

    private void ensureAgentProfile(String agentId) {
        UserAgent ua = userAgentMapper.findByAgentId(agentId);
        if (ua == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "智能体 " + agentId + " 不存在");
        }
        UserDistill distill = userDistillMapper.findByUserId(ua.getUserId());
        if (distill == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "用户 " + ua.getUserId() + " 未完成蒸馏");
        }

        ModelRefreshRequest req = new ModelRefreshRequest();
        req.setUserId(ua.getUserId());
        req.setAgentId(agentId);
        req.setSpeakStyle(distill.getSpeakStyle() != null ? distill.getSpeakStyle() : "");
        req.setCharacter(distill.getCharacterLabel() != null ? distill.getCharacterLabel() : "");
        req.setLoveStyle(distill.getLoveStyle() != null ? distill.getLoveStyle() : "");

        try {
            JsonNode valuesView =
                    distill.getValuesView() != null
                            ? objectMapper.readTree(distill.getValuesView())
                            : objectMapper.createObjectNode();
            req.setValuesView(valuesView);
        } catch (Exception e) {
            req.setValuesView(objectMapper.createObjectNode());
        }

        try {
            JsonNode taboo =
                    distill.getTaboo() != null
                            ? objectMapper.readTree(distill.getTaboo())
                            : objectMapper.createObjectNode();
            req.setTaboo(taboo);
        } catch (Exception e) {
            req.setTaboo(objectMapper.createObjectNode());
        }

        log.info("ensure agent profile, agentId={}", agentId);
        algoService.modelRefresh(req);
        log.info("agent model-refresh 完成, agentId={}", agentId);
    }

    private String callAgentChatStart(String matchId, String agentIdA, String agentIdB) {
        String url = matchingProperties.getAgentServiceUrl() + "/api/agent/algo/chat-start";

        ChatStartRequest req = new ChatStartRequest();
        req.setMatchId(matchId);
        req.setAgentIdA(agentIdA);
        req.setAgentIdB(agentIdB);
        req.setRoundLimit(matchingProperties.getSimulationRounds());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ChatStartRequest> entity = new HttpEntity<>(req, headers);

        log.info("开始调用 agent chat-start, matchId={}", matchId);
        ResponseEntity<AgentApiResponse> resp =
                restTemplate.postForEntity(url, entity, AgentApiResponse.class);

        AgentApiResponse body = resp.getBody();
        if (body == null || body.getCode() != 200) {
            String errMsg = body != null ? body.getMsg() : "agent 服务无响应";
            throw new BusinessException(ErrorCodes.INTERNAL, "chat-start 失败: " + errMsg);
        }

        JsonNode data = body.getData();
        if (data == null || !data.has("session_id")) {
            throw new BusinessException(ErrorCodes.INTERNAL, "chat-start 返回数据缺少 session_id");
        }

        String sessionId = data.get("session_id").asText();
        log.info("agent chat-start 完成, sessionId={}", sessionId);
        return sessionId;
    }

    private List<Map<String, String>> fetchChatRecords(String sessionId) {
        String url =
                matchingProperties.getAgentServiceUrl()
                        + "/api/agent/algo/chat-record?session_id="
                        + sessionId;

        ResponseEntity<AgentApiResponse> resp =
                restTemplate.getForEntity(url, AgentApiResponse.class);

        AgentApiResponse body = resp.getBody();
        if (body == null || body.getCode() != 200) {
            String errMsg = body != null ? body.getMsg() : "agent 服务无响应";
            throw new BusinessException(ErrorCodes.INTERNAL, "获取对话记录失败: " + errMsg);
        }

        JsonNode data = body.getData();
        if (data == null || !data.has("records")) {
            return List.of();
        }

        List<Map<String, String>> records = new ArrayList<>();
        for (JsonNode node : data.get("records")) {
            Map<String, String> row = new HashMap<>();
            row.put("speaker", node.has("speaker") ? node.get("speaker").asText() : "");
            row.put("content", node.has("content") ? node.get("content").asText() : "");
            row.put("id", node.has("id") ? node.get("id").asText() : "");
            row.put("timestamp", node.has("timestamp") ? node.get("timestamp").asText() : "");
            records.add(row);
        }

        log.info("获取到 {} 条对话记录, sessionId={}", records.size(), sessionId);
        return records;
    }

    private void runRiskDetect(String sessionId, List<Map<String, String>> chatRecords) {
        RiskDetectRequest req = new RiskDetectRequest();
        req.setSessionId(sessionId);
        req.setChatRecord(chatRecords);
        algoService.riskDetect(req);
    }
}
