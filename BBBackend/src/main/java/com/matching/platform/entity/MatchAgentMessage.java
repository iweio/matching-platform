package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class MatchAgentMessage {
    private Long id;
    private String messageId;
    private String matchId;
    private String speaker;
    private String content;
    private LocalDateTime createdAt;
}
