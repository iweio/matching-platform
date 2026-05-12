package com.matching.platform;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.matching.platform.mapper")
public class MatchingPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(MatchingPlatformApplication.class, args);
    }
}
