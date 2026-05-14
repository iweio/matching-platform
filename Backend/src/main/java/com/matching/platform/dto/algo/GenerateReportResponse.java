package com.matching.platform.dto.algo;

import com.matching.platform.dto.match.ReportDimensions;
import lombok.Data;

@Data
public class GenerateReportResponse {
    private int score;
    private ReportDimensions dimensions;
    private String advantage;
    private String risk;
    private String suggest;
}
