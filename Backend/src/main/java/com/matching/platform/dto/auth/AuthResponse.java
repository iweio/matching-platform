package com.matching.platform.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    @JsonProperty("userId")
    private String userId;

    @JsonProperty("agentId")
    private String agentId;

    @JsonProperty("token")
    private String token;

    @JsonProperty("nick")
    private String nick;

    @JsonProperty("distillStatus")
    private Integer distillStatus;
}
