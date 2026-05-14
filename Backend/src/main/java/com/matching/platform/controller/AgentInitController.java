package com.matching.platform.controller;

import com.matching.platform.common.ApiResponse;
import com.matching.platform.dto.agent.AgentInitRequest;
import com.matching.platform.dto.agent.AgentInitResponse;
import com.matching.platform.service.AgentInitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentInitController {

    private final AgentInitService agentInitService;

    @PostMapping("/init")
    public ApiResponse<AgentInitResponse> init(@Valid @RequestBody AgentInitRequest request) {
        return ApiResponse.ok("智能体创建成功", agentInitService.init(request));
    }
}
