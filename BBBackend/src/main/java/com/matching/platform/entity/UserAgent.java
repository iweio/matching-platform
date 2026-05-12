package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserAgent {
    private Long id;
    private String agentId;
    private String userId;
    private String personality;
    private String modelVersion;
    private LocalDateTime createTime;
}
