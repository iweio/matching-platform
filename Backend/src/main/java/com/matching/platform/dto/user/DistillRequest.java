package com.matching.platform.dto.user;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DistillRequest {
    private String userId;
    @NotBlank private String speakStyle;
    @NotBlank private String character;
    @NotBlank private String loveStyle;
    @NotNull private JsonNode valuesView;
    @NotNull private JsonNode taboo;
}
