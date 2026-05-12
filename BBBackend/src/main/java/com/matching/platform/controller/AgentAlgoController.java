package com.matching.platform.controller;

import com.matching.platform.common.ApiResponse;
import com.matching.platform.dto.algo.ChatStartRequest;
import com.matching.platform.dto.algo.ChatStartResponse;
import com.matching.platform.dto.algo.GenerateReportRequest;
import com.matching.platform.dto.algo.GenerateReportResponse;
import com.matching.platform.dto.algo.ModelRefreshRequest;
import com.matching.platform.dto.algo.ModelRefreshResponse;
import com.matching.platform.dto.algo.RiskDetectRequest;
import com.matching.platform.dto.algo.RiskDetectResponse;
import com.matching.platform.service.AlgoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent/algo")
@RequiredArgsConstructor
public class AgentAlgoController {

    private final AlgoService algoService;

    @PostMapping("/model-refresh")
    public ApiResponse<ModelRefreshResponse> modelRefresh(@Valid @RequestBody ModelRefreshRequest request) {
        return ApiResponse.ok("模型生成成功", algoService.modelRefresh(request));
    }

    @PostMapping("/chat-start")
    public ApiResponse<ChatStartResponse> chatStart(@Valid @RequestBody ChatStartRequest request) {
        // 双智能体对话模拟仅由 POST /api/match/start 事务提交后的链路触发，避免与本接口重复跑轮次
        return ApiResponse.ok("对话已启动", algoService.chatStart(request));
    }

    @PostMapping("/generate-report")
    public ApiResponse<GenerateReportResponse> generateReport(@Valid @RequestBody GenerateReportRequest request) {
        return ApiResponse.ok("报告生成成功", algoService.generateReport(request));
    }

    @PostMapping("/risk-detect")
    public ApiResponse<RiskDetectResponse> riskDetect(@Valid @RequestBody RiskDetectRequest request) {
        return ApiResponse.ok("检测完成", algoService.riskDetect(request));
    }
}
