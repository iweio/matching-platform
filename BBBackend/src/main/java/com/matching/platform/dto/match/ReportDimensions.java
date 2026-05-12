package com.matching.platform.dto.match;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDimensions {
    private int emotion;
    private int value;
    private int communication;
    private int lifestyle;
    private int future;
}
