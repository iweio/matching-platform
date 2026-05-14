package com.matching.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "matching")
public class MatchingProperties {
    private int agentChatRoundDelayMs = 80;
    private int simulationRounds = 30;
    private String internalToken = "";
    private String agentServiceUrl = "http://127.0.0.1:8001";
}
