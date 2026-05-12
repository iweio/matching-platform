package com.matching.platform.dto.match;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnlockRequest {
    @NotBlank private String matchId;
    @NotBlank private String userId;
    @NotBlank private String operation;
}
