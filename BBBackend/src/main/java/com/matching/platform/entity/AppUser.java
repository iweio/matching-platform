package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class AppUser {
    private Long id;
    private String userId;
    private String phone;
    private String nick;
    private Integer gender;
    private Integer age;
    private String passwordHash;
    private String bottomLine;
    private String avatar;
    private Integer height;
    private String education;
    private String occupation;
    private String provinceCode;
    private String cityCode;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
