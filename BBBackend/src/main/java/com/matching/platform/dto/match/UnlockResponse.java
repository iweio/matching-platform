package com.matching.platform.dto.match;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnlockResponse {
    private int unlockStatus;
    private boolean bothAgreed;
}
