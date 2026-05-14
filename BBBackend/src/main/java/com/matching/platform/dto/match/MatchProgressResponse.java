package com.matching.platform.dto.match;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MatchProgressResponse {
    private String matchId;
    private Integer status;
    private String partnerId;
    private Integer chatRound;
    @JsonProperty("a_op")
    private String aOp;
    @JsonProperty("b_op")
    private String bOp;
    @JsonProperty("unlock_flag")
    private Integer unlockFlag;
    @JsonProperty("my_op")
    private String myOp;
}
