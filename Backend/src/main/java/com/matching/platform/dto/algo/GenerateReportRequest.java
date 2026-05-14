package com.matching.platform.dto.algo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateReportRequest {
    @NotBlank private String sessionId;
    @NotBlank private String matchId;
}
