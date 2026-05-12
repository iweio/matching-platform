package com.matching.platform.dto.algo;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class AgentApiResponse {
    private int code;
    private String msg;
    private JsonNode data;
}
