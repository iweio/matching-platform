package com.matching.platform.dto.algo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskDetectResponse {
    private List<String> riskTags;
    private int riskScore;
    private String blockSuggest;
}
