package com.matching.platform.dto.algo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatStartRequest {
    @NotBlank private String matchId;
    @NotBlank private String agentIdA;
    @NotBlank private String agentIdB;
    private Integer roundLimit;
}
