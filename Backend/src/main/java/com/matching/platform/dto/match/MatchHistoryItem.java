package com.matching.platform.dto.match;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchHistoryItem {
    @JsonProperty("match_id")
    private String matchId;
    @JsonProperty("partner_id")
    private String partnerId;
    @JsonProperty("partner_nick")
    private String partnerNick;
    private Integer status;
    @JsonProperty("a_op")
    private String aOp;
    @JsonProperty("b_op")
    private String bOp;
    @JsonProperty("unlock_flag")
    private Integer unlockFlag;
    @JsonProperty("chat_round")
    private Integer chatRound;
    @JsonProperty("create_time")
    private String createTime;
    @JsonProperty("update_time")
    private String updateTime;
    private Integer score;
    private String advantage;
}
