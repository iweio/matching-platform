package com.matching.platform.common;

public final class ErrorCodes {
    public static final int PARAM_INVALID = 40001;
    public static final int UNAUTHORIZED = 40101;
    public static final int FORBIDDEN = 40301;
    public static final int NOT_FOUND = 40401;
    public static final int CONFLICT = 40901;
    public static final int PHONE_EXISTS = 40902;
    /** 数据库连接、SQL 执行、表不存在等 */
    public static final int DB_ERROR = 50002;
    public static final int INTERNAL = 50001;

    private ErrorCodes() {}
}
