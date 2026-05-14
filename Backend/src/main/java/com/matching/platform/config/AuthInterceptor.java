package com.matching.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.ApiResponse;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;

    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String authHeader = request.getHeader("Authorization");
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith(BEARER_PREFIX)) {
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(200);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.fail(ErrorCodes.UNAUTHORIZED, "未登录或Token已过期")));
            return false;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());
        if (!JwtUtil.validateToken(token)) {
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(200);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.fail(ErrorCodes.UNAUTHORIZED, "Token无效或已过期")));
            return false;
        }

        String userId = JwtUtil.extractUserId(token);
        request.setAttribute("userId", userId);
        return true;
    }
}
