package com.matching.platform.controller;

import com.matching.platform.common.ApiResponse;
import com.matching.platform.dto.user.ConversationItem;
import com.matching.platform.dto.user.DistillRequest;
import com.matching.platform.dto.user.DistillResponse;
import com.matching.platform.dto.user.UserMeResponse;
import com.matching.platform.dto.user.UserOtherResponse;
import com.matching.platform.service.UserApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserApplicationService userApplicationService;

    @PostMapping("/distill")
    public ApiResponse<DistillResponse> distill(@Valid @RequestBody DistillRequest request,
                                                HttpServletRequest httpReq) {
        String jwtUserId = (String) httpReq.getAttribute("userId");
        return ApiResponse.ok("人格蒸馏数据保存成功，模型生成中",
                userApplicationService.saveDistill(jwtUserId, request));
    }

    @GetMapping("/me")
    public ApiResponse<UserMeResponse> me(HttpServletRequest httpReq,
                                           @RequestParam(value = "user_id", required = false) String queryUserId) {
        String jwtUserId = (String) httpReq.getAttribute("userId");
        String targetUserId = (queryUserId != null && !queryUserId.isEmpty()) ? queryUserId : jwtUserId;
        return ApiResponse.ok(userApplicationService.getMe(targetUserId));
    }

    @GetMapping("/other")
    public ApiResponse<UserOtherResponse> other(
            @RequestParam("user_id") String userId, @RequestParam("match_id") String matchId) {
        return ApiResponse.ok(userApplicationService.getOther(userId, matchId));
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ConversationItem>> conversations(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return ApiResponse.ok("ok", userApplicationService.getConversations(userId));
    }
}
