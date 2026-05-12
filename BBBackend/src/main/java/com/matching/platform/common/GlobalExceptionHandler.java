package com.matching.platform.common;

import jakarta.validation.ConstraintViolationException;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBiz(BusinessException ex) {
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.fail(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String msg =
                ex.getBindingResult().getFieldErrors().stream()
                        .map(e -> e.getField() + ": " + e.getDefaultMessage())
                        .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.fail(ErrorCodes.PARAM_INVALID, msg));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.fail(ErrorCodes.PARAM_INVALID, ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Unreadable HTTP body: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.fail(ErrorCodes.PARAM_INVALID, "请求体不是合法 JSON，或与接口字段类型不匹配"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleIntegrity(DataIntegrityViolationException ex) {
        String raw = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String m = raw == null ? "" : raw.toLowerCase(Locale.ROOT);
        log.warn("Data integrity violation: {}", raw);
        if (m.contains("phone") || m.contains("app_user.phone")) {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(ApiResponse.fail(ErrorCodes.PHONE_EXISTS, "手机号已注册"));
        }
        if (m.contains("user_id") || m.contains("agent_id")) {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(ApiResponse.fail(ErrorCodes.CONFLICT, "业务主键冲突，请重试"));
        }
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.fail(ErrorCodes.CONFLICT, "数据约束冲突"));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataAccess(DataAccessException ex) {
        log.error("Database access error", ex);
        String hint =
                "数据库访问失败：请确认 MySQL 已启动，已创建库 matching_db，并已执行 backend/src/main/resources/db/schema.sql；"
                        + "同时检查 application.yml 中的 spring.datasource.url、username、password。";
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.fail(ErrorCodes.DB_ERROR, hint));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleOther(Exception ex) {
        log.error("Unhandled error", ex);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.fail(ErrorCodes.INTERNAL, "系统繁忙，请稍后重试"));
    }
}
