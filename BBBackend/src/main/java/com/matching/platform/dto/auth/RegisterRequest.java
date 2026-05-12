package com.matching.platform.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "请输入正确的11位手机号")
    private String phone;

    @NotBlank
    @Size(min = 2, max = 10, message = "昵称长度2-10个字符")
    private String nick;

    @NotBlank
    @Size(min = 6, max = 32, message = "密码长度6-32位")
    private String password;

    private Integer gender;
    private Integer age;
}
