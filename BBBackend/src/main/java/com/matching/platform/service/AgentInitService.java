package com.matching.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.dto.agent.AgentInitRequest;
import com.matching.platform.dto.agent.AgentInitResponse;
import com.matching.platform.entity.AppUser;
import com.matching.platform.entity.UserAgent;
import com.matching.platform.mapper.AppUserMapper;
import com.matching.platform.mapper.UserAgentMapper;
import com.matching.platform.util.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AgentInitService {

    private final AppUserMapper appUserMapper;
    private final UserAgentMapper userAgentMapper;
    private final ObjectMapper objectMapper;

    @Transactional
    public AgentInitResponse init(AgentInitRequest req) {
        if (appUserMapper.findByPhone(req.getPhone()) != null) {
            throw new BusinessException(ErrorCodes.PHONE_EXISTS, "手机号已注册");
        }
        String userId = IdGenerator.newUserId();
        String agentId = IdGenerator.newAgentId();
        AppUser u = new AppUser();
        u.setUserId(userId);
        u.setPhone(req.getPhone());
        u.setNick(req.getNick());
        u.setGender(req.getGender());
        u.setAge(req.getAge());
        if (req.getBottomLine() != null && !req.getBottomLine().isNull()) {
            try {
                u.setBottomLine(objectMapper.writeValueAsString(req.getBottomLine()));
            } catch (JsonProcessingException e) {
                throw new BusinessException(ErrorCodes.PARAM_INVALID, "bottom_line 格式错误");
            }
        }
        appUserMapper.insert(u);
        UserAgent a = new UserAgent();
        a.setAgentId(agentId);
        a.setUserId(userId);
        a.setPersonality(null);
        a.setModelVersion(null);
        userAgentMapper.insert(a);
        return new AgentInitResponse(userId, agentId);
    }
}
