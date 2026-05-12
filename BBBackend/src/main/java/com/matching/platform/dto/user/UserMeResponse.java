package com.matching.platform.dto.user;

import lombok.Data;

@Data
public class UserMeResponse {
    private String userId;
    private String nick;
    private Integer gender;
    private Integer age;
    private String agentId;
    private Integer distillStatus;
    private Integer matchCount;
    private Integer unlockCount;
}
