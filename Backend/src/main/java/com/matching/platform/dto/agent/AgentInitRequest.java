package com.matching.platform.dto.agent;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AgentInitRequest {
    @NotBlank private String phone;

    @NotBlank
    @Size(min = 2, max = 10, message = "昵称长度2-10个字符")
    private String nick;

    @NotNull private Integer gender;
    @NotNull private Integer age;
    private JsonNode bottomLine;
}
