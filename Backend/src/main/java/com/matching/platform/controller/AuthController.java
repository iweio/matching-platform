package com.matching.platform.controller;

import com.matching.platform.common.ApiResponse;
import com.matching.platform.dto.auth.AuthResponse;
import com.matching.platform.dto.auth.LoginRequest;
import com.matching.platform.dto.auth.RegisterRequest;
import com.matching.platform.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("注册成功", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("登录成功", authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthResponse> me(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return ApiResponse.ok("ok", authService.me(userId));
    }
}
