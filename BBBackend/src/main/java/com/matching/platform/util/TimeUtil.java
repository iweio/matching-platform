package com.matching.platform.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public final class TimeUtil {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private TimeUtil() {}

    public static String format(LocalDateTime t) {
        if (t == null) {
            return "";
        }
        return t.format(FMT);
    }

    public static String humanizeDuration(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return "";
        }
        long days = ChronoUnit.DAYS.between(start, end);
        if (days <= 0) {
            long hours = ChronoUnit.HOURS.between(start, end);
            return hours <= 0 ? "不足1小时" : hours + "小时";
        }
        return days + "天";
    }
}
