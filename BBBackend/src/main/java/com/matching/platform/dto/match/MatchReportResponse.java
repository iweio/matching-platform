package com.matching.platform.dto.match;

import lombok.Data;

@Data
public class MatchReportResponse {
    private String matchId;
    private int score;
    private ReportDimensions dimensions;
    private String advantage;
    private String risk;
    private String suggest;
}
