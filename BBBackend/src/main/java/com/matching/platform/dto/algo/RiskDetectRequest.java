package com.matching.platform.dto.algo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class RiskDetectRequest {
    @NotBlank private String sessionId;

    @NotEmpty private List<Map<String, String>> chatRecord;
}
