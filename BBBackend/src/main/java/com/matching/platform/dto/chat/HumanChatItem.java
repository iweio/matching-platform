package com.matching.platform.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HumanChatItem {
    @JsonProperty("message_id")
    private String id;
    @JsonProperty("sender_id")
    private String senderId;
    @JsonProperty("content")
    private String content;
    @JsonProperty("created_at")
    private String timestamp;
}
