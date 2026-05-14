package com.matching.platform.service;

import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.dto.auth.AuthResponse;
import com.matching.platform.dto.auth.LoginRequest;
import com.matching.platform.dto.auth.RegisterRequest;
import com.matching.platform.entity.AppUser;
import com.matching.platform.entity.UserAgent;
import com.matching.platform.entity.UserDistill;
import com.matching.platform.mapper.AppUserMapper;
import com.matching.platform.mapper.UserAgentMapper;
import com.matching.platform.mapper.UserDistillMapper;
import com.matching.platform.util.IdGenerator;
import com.matching.platform.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AppUserMapper appUserMapper;
    private final UserAgentMapper userAgentMapper;
    private final UserDistillMapper userDistillMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (appUserMapper.findByPhone(req.getPhone()) != null) {
            throw new BusinessException(ErrorCodes.PHONE_EXISTS, "手机号已注册");
        }

        String userId = IdGenerator.newUserId();
        String agentId = IdGenerator.newAgentId();

        AppUser u = new AppUser();
        u.setUserId(userId);
        u.setPhone(req.getPhone());
        u.setNick(req.getNick());
        u.setGender(req.getGender() != null ? req.getGender() : 1);
        u.setAge(req.getAge() != null ? req.getAge() : 25);
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        appUserMapper.insert(u);

        UserAgent a = new UserAgent();
        a.setAgentId(agentId);
        a.setUserId(userId);
        userAgentMapper.insert(a);

        String token = JwtUtil.generateToken(userId);
        log.info("新用户注册: userId={}, phone={}", userId, req.getPhone());
        return new AuthResponse(userId, agentId, token, req.getNick(), 0);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        AppUser u = appUserMapper.findByPhone(req.getPhone());
        if (u == null) {
            throw new BusinessException(ErrorCodes.UNAUTHORIZED, "手机号未注册");
        }
        if (u.getPasswordHash() == null || !passwordEncoder.matches(req.getPassword(), u.getPasswordHash())) {
            throw new BusinessException(ErrorCodes.UNAUTHORIZED, "密码错误");
        }

        UserAgent ua = userAgentMapper.findByUserId(u.getUserId());
        if (ua == null) {
            log.error("用户 {} 的智能体不存在，可能存在数据不一致", u.getUserId());
            throw new BusinessException(ErrorCodes.CONFLICT, "智能体数据异常，请联系客服");
        }

        UserDistill ud = userDistillMapper.findByUserId(u.getUserId());
        int ds = ud == null || ud.getDistillStatus() == null ? 0 : ud.getDistillStatus();

        String token = JwtUtil.generateToken(u.getUserId());
        log.info("用户登录: userId={}, phone={}", u.getUserId(), req.getPhone());
        return new AuthResponse(u.getUserId(), ua.getAgentId(), token, u.getNick(), ds);
    }

    public AuthResponse me(String userId) {
        AppUser u = appUserMapper.findByUserId(userId);
        if (u == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "用户不存在");
        }
        UserAgent ua = userAgentMapper.findByUserId(userId);
        UserDistill ud = userDistillMapper.findByUserId(userId);
        int ds = ud == null || ud.getDistillStatus() == null ? 0 : ud.getDistillStatus();
        return new AuthResponse(
                u.getUserId(),
                ua != null ? ua.getAgentId() : null,
                null,
                u.getNick(),
                ds
        );
    }
}
