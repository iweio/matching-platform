package com.matching.platform.dto.match;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentChatRecordItem {
    private String id;
    private String speaker;
    private String content;
    private String timestamp;
}
