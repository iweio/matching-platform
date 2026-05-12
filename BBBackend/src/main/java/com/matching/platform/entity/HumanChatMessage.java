package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HumanChatMessage {
    private Long id;
    private String messageId;
    private String matchId;
    private String senderId;
    private String content;
    private LocalDateTime createdAt;
}
