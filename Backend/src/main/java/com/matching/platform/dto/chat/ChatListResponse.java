package com.matching.platform.dto.chat;

import java.util.List;
import lombok.Data;

@Data
public class ChatListResponse {
    private List<HumanChatItem> messages;
    private int page;
    private long total;
}
