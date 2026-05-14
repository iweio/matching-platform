package com.matching.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.dto.algo.ModelRefreshRequest;
import com.matching.platform.dto.algo.ModelRefreshResponse;
import com.matching.platform.dto.user.ConversationItem;
import com.matching.platform.dto.user.DistillRequest;
import com.matching.platform.dto.user.DistillResponse;
import com.matching.platform.dto.user.UserMeResponse;
import com.matching.platform.dto.user.UserOtherResponse;
import com.matching.platform.entity.AppUser;
import com.matching.platform.entity.MatchRecord;
import com.matching.platform.entity.UserAgent;
import com.matching.platform.entity.UserDistill;
import com.matching.platform.mapper.AppUserMapper;
import com.matching.platform.mapper.MatchRecordMapper;
import com.matching.platform.mapper.UserAgentMapper;
import com.matching.platform.mapper.UserDistillMapper;
import com.matching.platform.util.TimeUtil;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserApplicationService {

    private final AppUserMapper appUserMapper;
    private final UserAgentMapper userAgentMapper;
    private final UserDistillMapper userDistillMapper;
    private final MatchRecordMapper matchRecordMapper;
    private final AlgoService algoService;
    private final ObjectMapper objectMapper;

    @Transactional
    public DistillResponse saveDistill(String jwtUserId, DistillRequest req) {
        AppUser u = appUserMapper.findByUserId(jwtUserId);
        if (u == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "用户不存在");
        }
        UserAgent ua = userAgentMapper.findByUserId(jwtUserId);
        if (ua == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "请先完成智能体初始化");
        }
        String valuesJson;
        String tabooJson;
        try {
            valuesJson = objectMapper.writeValueAsString(req.getValuesView());
            tabooJson = objectMapper.writeValueAsString(req.getTaboo());
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCodes.PARAM_INVALID, "JSON 字段格式错误");
        }
        UserDistill d = new UserDistill();
        d.setUserId(jwtUserId);
        d.setSpeakStyle(req.getSpeakStyle());
        d.setCharacterLabel(req.getCharacter());
        d.setLoveStyle(req.getLoveStyle());
        d.setValuesView(valuesJson);
        d.setTaboo(tabooJson);
        d.setDistillStatus(0);
        d.setProcessStatus("processing");
        d.setModelVersion(null);
        userDistillMapper.upsert(d);

        ModelRefreshRequest mr = new ModelRefreshRequest();
        mr.setUserId(jwtUserId);
        mr.setAgentId(ua.getAgentId());
        mr.setSpeakStyle(req.getSpeakStyle());
        mr.setCharacter(req.getCharacter());
        mr.setLoveStyle(req.getLoveStyle());
        mr.setValuesView(req.getValuesView());
        mr.setTaboo(req.getTaboo());
        ModelRefreshResponse res = algoService.modelRefresh(mr);
        return new DistillResponse("completed", res.getModelVersion());
    }

    public UserMeResponse getMe(String userId) {
        AppUser u = appUserMapper.findByUserId(userId);
        if (u == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "用户不存在");
        }
        UserAgent ua = userAgentMapper.findByUserId(userId);
        UserDistill ud = userDistillMapper.findByUserId(userId);
        UserMeResponse out = new UserMeResponse();
        out.setUserId(u.getUserId());
        out.setNick(u.getNick());
        out.setGender(u.getGender());
        out.setAge(u.getAge());
        out.setAgentId(ua == null ? null : ua.getAgentId());
        out.setDistillStatus(ud == null || ud.getDistillStatus() == null ? 0 : ud.getDistillStatus());
        out.setMatchCount((int) appUserMapper.countMatchesForUser(userId));
        out.setUnlockCount((int) appUserMapper.countUnlocksForUser(userId));
        return out;
    }

    public UserOtherResponse getOther(String userId, String matchId) {
        MatchRecord m = matchRecordMapper.findByMatchId(matchId);
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (!userId.equals(m.getUserA()) && !userId.equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "无权查看该匹配");
        }
        if (m.getUnlockFlag() == null
                || m.getUnlockFlag() != 1
                || m.getStatus() == null
                || m.getStatus() != 5) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "未解锁前不可查看对方资料");
        }
        String otherId = userId.equals(m.getUserA()) ? m.getUserB() : m.getUserA();
        AppUser ou = appUserMapper.findByUserId(otherId);
        if (ou == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "对方用户不存在");
        }
        UserDistill od = userDistillMapper.findByUserId(otherId);
        UserOtherResponse r = new UserOtherResponse();
        r.setUserId(ou.getUserId());
        r.setNick(ou.getNick());
        r.setGender(ou.getGender());
        r.setAge(ou.getAge());
        Map<String, Object> info = new HashMap<>();
        if (od != null) {
            info.put("speak_style", od.getSpeakStyle());
            info.put("character", od.getCharacterLabel());
        }
        r.setDistillInfo(info);
        LocalDateTime end = LocalDateTime.now();
        r.setMatchDuration(TimeUtil.humanizeDuration(m.getCreateTime(), end));
        return r;
    }

    public List<ConversationItem> getConversations(String userId) {
        List<Map<String, Object>> rows = matchRecordMapper.findConversationsByUserId(userId);
        List<ConversationItem> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String lastTime = null;
            Object lt = row.get("lastTime");
            if (lt instanceof java.time.LocalDateTime ldt) {
                lastTime = ldt.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
            } else if (lt instanceof java.sql.Timestamp ts) {
                lastTime = ts.toLocalDateTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
            } else if (lt != null) {
                lastTime = lt.toString();
            }
            result.add(new ConversationItem(
                    (String) row.get("matchId"),
                    (String) row.get("partnerUserId"),
                    (String) row.get("partnerNick"),
                    row.get("partnerGender") != null ? ((Number) row.get("partnerGender")).intValue() : null,
                    (String) row.get("lastMessage"),
                    lastTime,
                    row.get("unlockFlag") != null ? ((Number) row.get("unlockFlag")).intValue() : 0
            ));
        }
        return result;
    }
}
