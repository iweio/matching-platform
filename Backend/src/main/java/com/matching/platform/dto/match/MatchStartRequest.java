package com.matching.platform.dto.match;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MatchStartRequest {
    @NotBlank private String userId;
}
