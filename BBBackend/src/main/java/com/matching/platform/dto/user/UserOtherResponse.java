package com.matching.platform.dto.user;

import java.util.Map;
import lombok.Data;

@Data
public class UserOtherResponse {
    private String userId;
    private String nick;
    private Integer gender;
    private Integer age;
    private Map<String, Object> distillInfo;
    private String matchDuration;
}
