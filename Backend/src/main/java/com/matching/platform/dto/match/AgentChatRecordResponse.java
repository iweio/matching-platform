package com.matching.platform.dto.match;

import java.util.List;
import lombok.Data;

@Data
public class AgentChatRecordResponse {
    private List<AgentChatRecordItem> records;
    private boolean hasMore;
}
