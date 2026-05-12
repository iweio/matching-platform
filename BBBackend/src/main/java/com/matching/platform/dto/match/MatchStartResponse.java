package com.matching.platform.dto.match;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchStartResponse {
    private String matchId;
    private Integer status;
    private boolean queued;
    private String message;

    public MatchStartResponse(String matchId, Integer status) {
        this.matchId = matchId;
        this.status = status;
        this.queued = false;
    }

    public static MatchStartResponse queued(String message) {
        MatchStartResponse r = new MatchStartResponse();
        r.queued = true;
        r.message = message;
        return r;
    }
}
