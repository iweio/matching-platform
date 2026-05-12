package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class MatchRecord {
    private Long id;
    private String matchId;
    private String userA;
    private String userB;
    private Integer status;
    private String aOp;
    private String bOp;
    private Integer unlockFlag;
    private String sessionId;
    private Integer chatRound;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
