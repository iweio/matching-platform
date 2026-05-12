package com.matching.platform.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConversationItem {
    @JsonProperty("matchId")
    private String matchId;
    @JsonProperty("partnerUserId")
    private String partnerUserId;
    @JsonProperty("partnerNick")
    private String partnerNick;
    @JsonProperty("partnerGender")
    private Integer partnerGender;
    @JsonProperty("lastMessage")
    private String lastMessage;
    @JsonProperty("lastTime")
    private String lastTime;
    @JsonProperty("unlockFlag")
    private Integer unlockFlag;
}
