package com.matching.platform.util;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public final class IdGenerator {
    private static final SecureRandom RANDOM = new SecureRandom();

    private IdGenerator() {}

    public static String newUserId() {
        return "user_" + System.currentTimeMillis() + "_" + randomHex(4);
    }

    public static String newAgentId() {
        return "agent_" + System.currentTimeMillis() + "_" + randomHex(4);
    }

    public static String newMatchId() {
        return "match_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "_" + randomHex(6);
    }

    public static String newSessionId() {
        return "session_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private static String randomHex(int bytes) {
        byte[] buf = new byte[bytes];
        RANDOM.nextBytes(buf);
        StringBuilder sb = new StringBuilder(bytes * 2);
        for (byte b : buf) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
