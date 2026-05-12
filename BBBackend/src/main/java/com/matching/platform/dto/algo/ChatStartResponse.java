package com.matching.platform.dto.algo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatStartResponse {
    private String sessionId;
    private String chatStatus;
}
