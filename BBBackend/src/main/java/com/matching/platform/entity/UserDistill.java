package com.matching.platform.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserDistill {
    private Long id;
    private String userId;
    private String speakStyle;
    private String characterLabel;
    private String loveStyle;
    private String valuesView;
    private String taboo;
    private Integer distillStatus;
    private String processStatus;
    private String modelVersion;
    private LocalDateTime updateTime;
}
