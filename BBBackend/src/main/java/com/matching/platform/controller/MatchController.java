package com.matching.platform.controller;

import com.matching.platform.common.ApiResponse;
import com.matching.platform.dto.match.AgentChatRecordResponse;
import com.matching.platform.dto.match.MatchHistoryItem;
import com.matching.platform.dto.match.MatchProgressResponse;
import com.matching.platform.dto.match.MatchReportResponse;
import com.matching.platform.dto.match.MatchStartRequest;
import com.matching.platform.dto.match.MatchStartResponse;
import com.matching.platform.dto.match.UnlockRequest;
import com.matching.platform.dto.match.UnlockResponse;
import com.matching.platform.service.MatchApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchApplicationService matchApplicationService;

    @PostMapping("/start")
    public ApiResponse<MatchStartResponse> start(@Valid @RequestBody MatchStartRequest request) {
        return ApiResponse.ok("匹配已发起", matchApplicationService.startMatch(request.getUserId()));
    }

    @GetMapping("/progress")
    public ApiResponse<MatchProgressResponse> progress(
            @RequestParam("match_id") String matchId, @RequestParam("user_id") String userId) {
        return ApiResponse.ok(matchApplicationService.getProgress(matchId, userId));
    }

    @GetMapping("/waiting-status")
    public ApiResponse<MatchStartResponse> waitingStatus(@RequestParam("user_id") String userId) {
        return ApiResponse.ok(matchApplicationService.getWaitingStatus(userId));
    }

    @GetMapping("/chat-record")
    public ApiResponse<AgentChatRecordResponse> chatRecord(
            @RequestParam("match_id") String matchId, @RequestParam(value = "since_id", required = false) String sinceId) {
        return ApiResponse.ok(matchApplicationService.getChatRecord(matchId, sinceId));
    }

    @PostMapping("/unlock")
    public ApiResponse<UnlockResponse> unlock(@Valid @RequestBody UnlockRequest request) {
        return ApiResponse.ok("操作成功，等待对方确认", matchApplicationService.unlock(request));
    }

    @GetMapping(value = "/chat-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(
            @RequestParam("match_id") String matchId,
            @RequestParam("user_id") String userId) {
        return matchApplicationService.streamChat(matchId, userId);
    }

    @GetMapping("/report")
    public ApiResponse<MatchReportResponse> report(
            @RequestParam("match_id") String matchId, @RequestParam("user_id") String userId) {
        return ApiResponse.ok(matchApplicationService.getReport(matchId, userId));
    }

    @GetMapping("/history")
    public ApiResponse<List<MatchHistoryItem>> history(@RequestParam("user_id") String userId) {
        return ApiResponse.ok(matchApplicationService.getHistory(userId));
    }
}
