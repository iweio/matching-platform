package com.matching.platform.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatSendRequest {
    @NotBlank private String matchId;
    @NotBlank private String senderId;
    @NotBlank private String content;
}
