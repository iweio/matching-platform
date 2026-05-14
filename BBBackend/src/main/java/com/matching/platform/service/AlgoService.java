package com.matching.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.config.MatchingProperties;
import com.matching.platform.dto.algo.AgentApiResponse;
import com.matching.platform.dto.algo.ChatStartRequest;
import com.matching.platform.dto.algo.ChatStartResponse;
import com.matching.platform.dto.algo.GenerateReportRequest;
import com.matching.platform.dto.algo.GenerateReportResponse;
import com.matching.platform.dto.algo.ModelRefreshRequest;
import com.matching.platform.dto.algo.ModelRefreshResponse;
import com.matching.platform.dto.algo.RiskDetectRequest;
import com.matching.platform.dto.algo.RiskDetectResponse;
import com.matching.platform.dto.match.ReportDimensions;
import com.matching.platform.entity.MatchRecord;
import com.matching.platform.entity.MatchReport;
import com.matching.platform.entity.UserAgent;

import com.matching.platform.mapper.MatchRecordMapper;
import com.matching.platform.mapper.MatchReportMapper;
import com.matching.platform.mapper.UserAgentMapper;
import com.matching.platform.mapper.UserDistillMapper;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlgoService {

    private final UserAgentMapper userAgentMapper;
    private final UserDistillMapper userDistillMapper;
    private final MatchRecordMapper matchRecordMapper;
    private final MatchReportMapper matchReportMapper;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final MatchingProperties matchingProperties;

    @Transactional
    public ModelRefreshResponse modelRefresh(ModelRefreshRequest req) {
        UserAgent ua = userAgentMapper.findByAgentId(req.getAgentId());
        if (ua == null || !ua.getUserId().equals(req.getUserId())) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "智能体不存在或不属于该用户");
        }

        String url = matchingProperties.getAgentServiceUrl() + "/api/agent/algo/model-refresh";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ModelRefreshRequest> entity = new HttpEntity<>(req, headers);
            ResponseEntity<AgentApiResponse> resp =
                    restTemplate.postForEntity(url, entity, AgentApiResponse.class);

            AgentApiResponse body = resp.getBody();
            if (body == null) {
                log.error("agent model-refresh 无响应");
                throw new BusinessException(ErrorCodes.INTERNAL, "agent 服务无响应");
            }
            if (body.getCode() != 200) {
                String errMsg = body.getMsg() != null ? body.getMsg() : "";
                if (errMsg.contains("已存在")) {
                    String mv = userAgentMapper.findByAgentId(req.getAgentId()).getModelVersion();
                    if (mv == null) {
                        mv = "v1.0." + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
                        userAgentMapper.updateModelVersion(req.getAgentId(), mv);
                    }
                    userDistillMapper.updateModelState(req.getUserId(), 1, mv, "completed");
                    log.info("agent model-refresh 幂等命中，agent={} 已存在，使用已有版本 {}", req.getAgentId(), mv);
                    return new ModelRefreshResponse(mv, "success");
                }
                log.error("agent model-refresh 失败: {}", errMsg);
                throw new BusinessException(ErrorCodes.INTERNAL, "模型生成失败: " + errMsg);
            }

            JsonNode data = body.getData();
            String modelVersion =
                    data != null && data.has("model_version")
                            ? data.get("model_version").asText()
                            : "v1.0." + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
            String status =
                    data != null && data.has("status") ? data.get("status").asText() : "success";

            String mv = modelVersion;
            userAgentMapper.updateModelVersion(req.getAgentId(), mv);
            userDistillMapper.updateModelState(req.getUserId(), 1, mv, "completed");

            return new ModelRefreshResponse(mv, status);
        } catch (RestClientException e) {
            log.error("调用 agent model-refresh 异常", e);
            throw new BusinessException(ErrorCodes.INTERNAL, "agent 服务调用失败: " + e.getMessage());
        }
    }

    @Transactional
    public ChatStartResponse chatStart(ChatStartRequest req) {
        MatchRecord m = matchRecordMapper.findByMatchId(req.getMatchId());
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (m.getStatus() != null && m.getStatus() == 1 && m.getSessionId() != null) {
            return new ChatStartResponse(m.getSessionId(), "running");
        }
        UserAgent a = userAgentMapper.findByAgentId(req.getAgentIdA());
        UserAgent b = userAgentMapper.findByAgentId(req.getAgentIdB());
        if (a == null || b == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "智能体不存在");
        }
        if (!a.getUserId().equals(m.getUserA()) || !b.getUserId().equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.PARAM_INVALID, "智能体与匹配用户不一致");
        }
        m.setStatus(1);
        m.setChatRound(0);
        matchRecordMapper.update(m);
        return new ChatStartResponse(null, "starting");
    }

    @Transactional
    public GenerateReportResponse generateReport(GenerateReportRequest req) {
        MatchRecord m = matchRecordMapper.findByMatchId(req.getMatchId());
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (m.getSessionId() == null || !m.getSessionId().equals(req.getSessionId())) {
            throw new BusinessException(ErrorCodes.PARAM_INVALID, "会话不一致");
        }
        MatchReport existing = matchReportMapper.findByMatchId(req.getMatchId());
        if (existing != null && m.getStatus() != null && m.getStatus() >= 3) {
            return toGenerateResponse(existing);
        }

        String url = matchingProperties.getAgentServiceUrl() + "/api/agent/algo/generate-report";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GenerateReportRequest> entity = new HttpEntity<>(req, headers);
            ResponseEntity<AgentApiResponse> resp =
                    restTemplate.postForEntity(url, entity, AgentApiResponse.class);

            AgentApiResponse body = resp.getBody();
            if (body == null || body.getCode() != 200) {
                String errMsg = body != null ? body.getMsg() : "agent 服务无响应";
                log.error("agent generate-report 失败: {}", errMsg);
                throw new BusinessException(ErrorCodes.INTERNAL, "报告生成失败: " + errMsg);
            }

            JsonNode data = body.getData();
            int score = data != null && data.has("score") ? data.get("score").asInt() : 0;
            JsonNode dimsNode = data != null ? data.get("dimensions") : null;
            ReportDimensions dims = new ReportDimensions(0, 0, 0, 0, 0);
            if (dimsNode != null) {
                dims.setEmotion(dimsNode.has("emotion") ? dimsNode.get("emotion").asInt() : 0);
                dims.setValue(dimsNode.has("value") ? dimsNode.get("value").asInt() : 0);
                dims.setCommunication(
                        dimsNode.has("communication") ? dimsNode.get("communication").asInt() : 0);
                dims.setLifestyle(
                        dimsNode.has("lifestyle") ? dimsNode.get("lifestyle").asInt() : 0);
                dims.setFuture(dimsNode.has("future") ? dimsNode.get("future").asInt() : 0);
            }
            String advantage =
                    data != null && data.has("advantage") ? data.get("advantage").asText() : "";
            String risk = data != null && data.has("risk") ? data.get("risk").asText() : "";
            String suggest =
                    data != null && data.has("suggest") ? data.get("suggest").asText() : "";

            String dimJson = objectMapper.writeValueAsString(dims);
            MatchReport r = new MatchReport();
            r.setMatchId(req.getMatchId());
            r.setScore(score);
            r.setDimensions(dimJson);
            r.setAdvantage(advantage);
            r.setRisk(risk);
            r.setSuggest(suggest);
            matchReportMapper.upsert(r);

            m.setStatus(3);
            matchRecordMapper.update(m);

            GenerateReportResponse out = new GenerateReportResponse();
            out.setScore(score);
            out.setDimensions(dims);
            out.setAdvantage(advantage);
            out.setRisk(risk);
            out.setSuggest(suggest);
            return out;
        } catch (RestClientException e) {
            log.error("调用 agent generate-report 异常", e);
            throw new BusinessException(ErrorCodes.INTERNAL, "agent 服务调用失败: " + e.getMessage());
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCodes.INTERNAL, "序列化失败");
        }
    }

    public RiskDetectResponse riskDetect(RiskDetectRequest req) {
        String url = matchingProperties.getAgentServiceUrl() + "/api/agent/algo/risk-detect";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<RiskDetectRequest> entity = new HttpEntity<>(req, headers);
            ResponseEntity<AgentApiResponse> resp =
                    restTemplate.postForEntity(url, entity, AgentApiResponse.class);

            AgentApiResponse body = resp.getBody();
            if (body == null || body.getCode() != 200) {
                String errMsg = body != null ? body.getMsg() : "agent 服务无响应";
                log.error("agent risk-detect 失败: {}", errMsg);
                return new RiskDetectResponse(List.of("检测失败"), 0, errMsg);
            }

            JsonNode data = body.getData();
            List<String> riskTags = new ArrayList<>();
            if (data != null && data.has("risk_tags")) {
                for (JsonNode tag : data.get("risk_tags")) {
                    riskTags.add(tag.asText());
                }
            }
            int riskScore =
                    data != null && data.has("risk_score") ? data.get("risk_score").asInt() : 0;
            String blockSuggest =
                    data != null && data.has("block_suggest")
                            ? data.get("block_suggest").asText()
                            : "";

            return new RiskDetectResponse(riskTags, riskScore, blockSuggest);
        } catch (RestClientException e) {
            log.error("调用 agent risk-detect 异常", e);
            return new RiskDetectResponse(List.of("检测异常"), 0, e.getMessage());
        }
    }

    private GenerateReportResponse toGenerateResponse(MatchReport r) {
        GenerateReportResponse out = new GenerateReportResponse();
        out.setScore(r.getScore() == null ? 0 : r.getScore());
        out.setAdvantage(r.getAdvantage());
        out.setRisk(r.getRisk());
        out.setSuggest(r.getSuggest());
        try {
            if (r.getDimensions() != null && !r.getDimensions().isBlank()) {
                out.setDimensions(objectMapper.readValue(r.getDimensions(), ReportDimensions.class));
            } else {
                out.setDimensions(new ReportDimensions(0, 0, 0, 0, 0));
            }
        } catch (JsonProcessingException e) {
            out.setDimensions(new ReportDimensions(0, 0, 0, 0, 0));
        }
        return out;
    }
}
