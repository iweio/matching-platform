package com.matching.platform.controller;

import com.matching.platform.common.ApiResponse;
import com.matching.platform.dto.chat.ChatListResponse;
import com.matching.platform.dto.chat.ChatSendRequest;
import com.matching.platform.dto.chat.ChatSendResponse;
import com.matching.platform.service.HumanChatApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final HumanChatApplicationService humanChatApplicationService;

    @PostMapping("/send")
    public ApiResponse<ChatSendResponse> send(@Valid @RequestBody ChatSendRequest request) {
        return ApiResponse.ok("消息发送成功", humanChatApplicationService.send(request));
    }

    @GetMapping("/list")
    public ApiResponse<ChatListResponse> list(
            @RequestParam("match_id") String matchId,
            @RequestParam("user_id") String userId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "page_size", required = false, defaultValue = "20") int pageSize) {
        return ApiResponse.ok(humanChatApplicationService.list(matchId, userId, page, pageSize));
    }
}
