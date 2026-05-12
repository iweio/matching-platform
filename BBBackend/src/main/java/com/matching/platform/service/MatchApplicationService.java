package com.matching.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.config.MatchingProperties;
import com.matching.platform.dto.algo.AgentApiResponse;
import com.matching.platform.dto.algo.ChatStartRequest;
import com.matching.platform.dto.match.AgentChatRecordItem;
import com.matching.platform.dto.match.AgentChatRecordResponse;
import com.matching.platform.dto.match.MatchHistoryItem;
import com.matching.platform.dto.match.MatchProgressResponse;
import com.matching.platform.dto.match.MatchReportResponse;
import com.matching.platform.dto.match.MatchStartResponse;
import com.matching.platform.dto.match.ReportDimensions;
import com.matching.platform.dto.match.UnlockRequest;
import com.matching.platform.dto.match.UnlockResponse;
import com.matching.platform.entity.AppUser;
import com.matching.platform.entity.MatchAgentMessage;
import com.matching.platform.entity.MatchRecord;
import com.matching.platform.entity.MatchReport;
import com.matching.platform.entity.UserAgent;
import com.matching.platform.entity.UserDistill;
import com.matching.platform.mapper.AppUserMapper;
import com.matching.platform.mapper.MatchAgentMessageMapper;
import com.matching.platform.mapper.MatchRecordMapper;
import com.matching.platform.mapper.MatchReportMapper;
import com.matching.platform.mapper.UserAgentMapper;
import com.matching.platform.mapper.UserDistillMapper;
import com.matching.platform.util.IdGenerator;
import com.matching.platform.util.TimeUtil;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchApplicationService {

    private final AppUserMapper appUserMapper;
    private final UserAgentMapper userAgentMapper;
    private final UserDistillMapper userDistillMapper;
    private final MatchRecordMapper matchRecordMapper;
    private final MatchReportMapper matchReportMapper;
    private final MatchAgentMessageMapper matchAgentMessageMapper;
    private final AlgoService algoService;
    private final MatchSimulationRunner matchSimulationRunner;
    private final TransactionTemplate transactionTemplate;
    private final MatchingProperties matchingProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    private final MatchPoolService matchPoolService;

    @Transactional
    public MatchStartResponse startMatch(String userId) {
        AppUser self = appUserMapper.findByUserId(userId);
        if (self == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "用户不存在");
        }
        UserDistill distill = userDistillMapper.findByUserId(userId);
        if (distill == null || distill.getDistillStatus() == null || distill.getDistillStatus() != 1) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "请先完成人格蒸馏");
        }
        if (matchRecordMapper.countActiveForUser(userId) > 0) {
            // Already matched — return existing match id
            MatchRecord existing = matchRecordMapper.findActiveForUser(userId).get(0);
            return new MatchStartResponse(existing.getMatchId(), existing.getStatus());
        }
        // Already in pool, just keep waiting
        if (matchPoolService.isWaiting(userId)) {
            return MatchStartResponse.queued("正在匹配中，请等待...");
        }
        // Try matching pool — find compatible partner
        String partnerId = matchPoolService.findAndMatch(userId, self.getGender());
        if (partnerId == null) {
            matchPoolService.join(userId, self.getGender());
            return MatchStartResponse.queued("暂无可匹配用户，已加入匹配池等待");
        }
        return createMatch(userId, partnerId);
    }

    private MatchStartResponse createMatch(String userId, String partnerId) {
        UserAgent agentA = userAgentMapper.findByUserId(userId);
        UserAgent agentB = userAgentMapper.findByUserId(partnerId);
        if (agentA == null || agentB == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "智能体数据不完整");
        }
        String matchId = IdGenerator.newMatchId();
        MatchRecord m = new MatchRecord();
        m.setMatchId(matchId);
        m.setUserA(userId);
        m.setUserB(partnerId);
        m.setStatus(0);
        m.setAOp(null);
        m.setBOp(null);
        m.setUnlockFlag(0);
        m.setSessionId(null);
        m.setChatRound(0);
        matchRecordMapper.insert(m);
        final String mid = matchId;
        final String aidA = agentA.getAgentId();
        final String aidB = agentB.getAgentId();
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        transactionTemplate.executeWithoutResult(
                                st -> {
                                    ChatStartRequest csr = new ChatStartRequest();
                                    csr.setMatchId(mid);
                                    csr.setAgentIdA(aidA);
                                    csr.setAgentIdB(aidB);
                                    csr.setRoundLimit(matchingProperties.getSimulationRounds());
                                    algoService.chatStart(csr);
                                });
                        matchSimulationRunner.simulate(mid, aidA, aidB);
                    }
                });
        return new MatchStartResponse(matchId, 0);
    }

    public MatchStartResponse getWaitingStatus(String userId) {
        // Check if user has been matched (has active match)
        if (matchRecordMapper.countActiveForUser(userId) > 0) {
            MatchRecord m = matchRecordMapper.findActiveForUser(userId).get(0);
            matchPoolService.leave(userId);
            return new MatchStartResponse(m.getMatchId(), m.getStatus());
        }
        if (matchPoolService.isWaiting(userId)) {
            return MatchStartResponse.queued("正在匹配池中等待...");
        }
        MatchStartResponse r = new MatchStartResponse();
        r.setStatus(0);
        r.setQueued(false);
        r.setMessage("未在匹配中");
        return r;
    }

    public List<MatchHistoryItem> getHistory(String userId) {
        List<Map<String, Object>> rows = matchRecordMapper.findHistoryByUserId(userId);
        List<MatchHistoryItem> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            MatchHistoryItem item = new MatchHistoryItem();
            item.setMatchId((String) row.get("matchId"));
            item.setPartnerId((String) row.get("partnerId"));
            item.setPartnerNick((String) row.get("partnerNick"));
            item.setStatus(row.get("status") != null ? ((Number) row.get("status")).intValue() : null);
            item.setAOp((String) row.get("aOp"));
            item.setBOp((String) row.get("bOp"));
            item.setUnlockFlag(row.get("unlockFlag") != null ? ((Number) row.get("unlockFlag")).intValue() : null);
            item.setChatRound(row.get("chatRound") != null ? ((Number) row.get("chatRound")).intValue() : null);
            item.setCreateTime(row.get("createTime") != null ? row.get("createTime").toString() : null);
            item.setUpdateTime(row.get("updateTime") != null ? row.get("updateTime").toString() : null);
            item.setScore(row.get("score") != null ? ((Number) row.get("score")).intValue() : null);
            item.setAdvantage((String) row.get("advantage"));
            result.add(item);
        }
        return result;
    }

    public MatchProgressResponse getProgress(String matchId, String userId) {
        MatchRecord m = matchRecordMapper.findByMatchId(matchId);
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (!userId.equals(m.getUserA()) && !userId.equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "无权查看该匹配");
        }
        MatchProgressResponse r = new MatchProgressResponse();
        r.setMatchId(m.getMatchId());
        r.setStatus(m.getStatus());
        r.setChatRound(m.getChatRound() == null ? 0 : m.getChatRound());
        r.setAOp(m.getAOp());
        r.setBOp(m.getBOp());
        r.setUnlockFlag(m.getUnlockFlag());
        if (userId.equals(m.getUserA())) {
            r.setPartnerId(m.getUserB());
        } else {
            r.setPartnerId(m.getUserA());
        }
        return r;
    }

    public AgentChatRecordResponse getChatRecord(String matchId, String sinceId) {
        MatchRecord m = matchRecordMapper.findByMatchId(matchId);
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }

        if (m.getStatus() != null && m.getStatus() == 1 && m.getSessionId() != null && !m.getSessionId().isBlank()) {
            try {
                return fetchFromAgent(m.getSessionId(), sinceId);
            } catch (Exception e) {
                // fallback to DB
            }
        }

        long after = parseSinceId(sinceId);
        int limit = 101;
        List<MatchAgentMessage> rows = matchAgentMessageMapper.findAfterId(matchId, after, limit);
        boolean hasMore = rows.size() > 100;
        List<MatchAgentMessage> page = hasMore ? rows.subList(0, 100) : rows;
        List<AgentChatRecordItem> items = new ArrayList<>();
        for (MatchAgentMessage row : page) {
            String mid =
                    row.getMessageId() != null && !row.getMessageId().isBlank()
                            ? row.getMessageId()
                            : ("msg_" + row.getId());
            items.add(
                    new AgentChatRecordItem(
                            mid, row.getSpeaker(), row.getContent(), TimeUtil.format(row.getCreatedAt())));
        }
        AgentChatRecordResponse resp = new AgentChatRecordResponse();
        resp.setRecords(items);
        resp.setHasMore(hasMore);
        return resp;
    }

    @Transactional
    public UnlockResponse unlock(UnlockRequest req) {
        MatchRecord m = matchRecordMapper.findByMatchId(req.getMatchId());
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (!req.getUserId().equals(m.getUserA()) && !req.getUserId().equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "无权操作该匹配");
        }
        if (m.getStatus() == null || m.getStatus() != 3) {
            throw new BusinessException(ErrorCodes.CONFLICT, "当前状态不可解锁确认");
        }
        String op = req.getOperation() == null ? "" : req.getOperation().toLowerCase();
        boolean isA = req.getUserId().equals(m.getUserA());
        if ("reject".equals(op)) {
            if (isA) {
                m.setAOp("reject");
            } else {
                m.setBOp("reject");
            }
            m.setStatus(4);
            matchRecordMapper.update(m);
            return new UnlockResponse(0, false);
        }
        if ("agree".equals(op)) {
            if (isA) {
                m.setAOp("agree");
            } else {
                m.setBOp("agree");
            }
            boolean both =
                    "agree".equalsIgnoreCase(m.getAOp()) && "agree".equalsIgnoreCase(m.getBOp());
            if (both) {
                m.setUnlockFlag(1);
                m.setStatus(5);
            }
            matchRecordMapper.update(m);
            int unlock = m.getUnlockFlag() != null && m.getUnlockFlag() == 1 ? 1 : 0;
            return new UnlockResponse(unlock, both);
        }
        throw new BusinessException(ErrorCodes.PARAM_INVALID, "operation 非法");
    }

    public MatchReportResponse getReport(String matchId, String userId) {
        MatchRecord m = matchRecordMapper.findByMatchId(matchId);
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (!userId.equals(m.getUserA()) && !userId.equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "无权查看该报告");
        }
        if (m.getStatus() == null || m.getStatus() < 2) {
            throw new BusinessException(ErrorCodes.CONFLICT, "报告尚未生成");
        }
        MatchReport r = matchReportMapper.findByMatchId(matchId);
        if (r == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "报告不存在");
        }
        MatchReportResponse out = new MatchReportResponse();
        out.setMatchId(matchId);
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

    public SseEmitter streamChat(String matchId, String userId) {
        MatchRecord m = matchRecordMapper.findByMatchId(matchId);
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (!userId.equals(m.getUserA()) && !userId.equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "无权查看该匹配");
        }

        SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        String[] lastId = {""};
        boolean[] agentUnavailable = {false};

        Runnable poll = () -> {
            try {
                MatchRecord current = matchRecordMapper.findByMatchId(matchId);
                if (current == null || current.getStatus() == null) {
                    emitter.complete();
                    scheduler.shutdown();
                    return;
                }

                boolean fetched = false;
                if (!agentUnavailable[0] && current.getSessionId() != null && !current.getSessionId().isBlank()) {
                    try {
                        AgentChatRecordResponse record = fetchFromAgent(current.getSessionId(), lastId[0]);
                        if (record.getRecords() != null && !record.getRecords().isEmpty()) {
                            for (AgentChatRecordItem item : record.getRecords()) {
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data(item));
                                lastId[0] = item.getId();
                            }
                            fetched = true;
                        }
                    } catch (Exception e) {
                        log.warn("agent 服务获取对话记录失败，回退到 DB: matchId={}", matchId);
                        agentUnavailable[0] = true;
                    }
                }

                if (!fetched) {
                    long after = parseSinceId(lastId[0]);
                    List<MatchAgentMessage> rows = matchAgentMessageMapper.findAfterId(matchId, after, 100);
                    for (MatchAgentMessage row : rows) {
                        String mid = row.getMessageId() != null && !row.getMessageId().isBlank()
                                ? row.getMessageId()
                                : ("msg_" + row.getId());
                        AgentChatRecordItem item = new AgentChatRecordItem(
                                mid, row.getSpeaker(), row.getContent(),
                                row.getCreatedAt() != null ? TimeUtil.format(row.getCreatedAt()) : "");
                        emitter.send(SseEmitter.event()
                                .name("message")
                                .data(item));
                        lastId[0] = mid;
                    }
                }

                if (current.getStatus() >= 2) {
                    emitter.send(SseEmitter.event().name("done").data("completed"));
                    emitter.complete();
                    scheduler.shutdown();
                }
            } catch (Exception e) {
                // ignore poll errors, keep trying
            }
        };

        scheduler.scheduleAtFixedRate(poll, 0, 500, TimeUnit.MILLISECONDS);

        emitter.onCompletion(scheduler::shutdownNow);
        emitter.onTimeout(scheduler::shutdownNow);
        emitter.onError(ex -> scheduler.shutdownNow());

        return emitter;
    }

    private AgentChatRecordResponse fetchFromAgent(String sessionId, String sinceId) {
        String url = matchingProperties.getAgentServiceUrl()
                + "/api/agent/algo/chat-record?session_id=" + sessionId;
        if (sinceId != null && !sinceId.isBlank()) {
            url += "&since_id=" + sinceId;
        }
        AgentApiResponse body = restTemplate.getForObject(url, AgentApiResponse.class);
        if (body == null || body.getCode() != 200 || body.getData() == null) {
            throw new BusinessException(ErrorCodes.INTERNAL, "获取 agent 对话记录失败");
        }
        JsonNode data = body.getData();
        List<AgentChatRecordItem> items = new ArrayList<>();
        if (data.has("records")) {
            for (JsonNode node : data.get("records")) {
                items.add(new AgentChatRecordItem(
                        node.has("id") ? node.get("id").asText() : "",
                        node.has("speaker") ? node.get("speaker").asText() : "",
                        node.has("content") ? node.get("content").asText() : "",
                        node.has("timestamp") ? node.get("timestamp").asText() : ""));
            }
        }
        boolean hasMore = data.has("has_more") && data.get("has_more").asBoolean();
        AgentChatRecordResponse resp = new AgentChatRecordResponse();
        resp.setRecords(items);
        resp.setHasMore(hasMore);
        return resp;
    }

    private static long parseSinceId(String sinceId) {
        if (sinceId == null || sinceId.isBlank()) {
            return 0L;
        }
        if (!sinceId.startsWith("msg_")) {
            return 0L;
        }
        try {
            return Long.parseLong(sinceId.substring(4));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
