package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class MatchReport {
    private Long id;
    private String matchId;
    private Integer score;
    private String dimensions;
    private String advantage;
    private String risk;
    private String suggest;
    private LocalDateTime createTime;
}
