package com.matching.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matching.platform.common.ApiResponse;
import com.matching.platform.common.ErrorCodes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class InternalAlgoInterceptor implements HandlerInterceptor {

    private final MatchingProperties matchingProperties;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String expected = matchingProperties.getInternalToken();
        if (!StringUtils.hasText(expected)) {
            return true;
        }
        String provided = request.getHeader("X-Internal-Token");
        if (!expected.equals(provided)) {
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(200);
            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.fail(ErrorCodes.FORBIDDEN, "内部接口鉴权失败")));
            return false;
        }
        return true;
    }
}
