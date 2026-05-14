CREATE TABLE IF NOT EXISTS app_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    phone VARCHAR(32) NOT NULL UNIQUE,
    nick VARCHAR(64) NOT NULL,
    gender TINYINT,
    age INT,
    password_hash VARCHAR(128) NULL,
    bottom_line JSON NULL,
    avatar VARCHAR(512) NULL,
    height SMALLINT NULL,
    education VARCHAR(32) NULL,
    occupation VARCHAR(128) NULL,
    province_code VARCHAR(32) NULL,
    city_code VARCHAR(32) NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gender_age (gender, age)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_agent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL UNIQUE,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    personality VARCHAR(32) NULL,
    model_version VARCHAR(64) NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_distill (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    speak_style VARCHAR(32) NULL,
    character_label VARCHAR(32) NULL,
    love_style VARCHAR(32) NULL,
    values_view JSON NULL,
    taboo JSON NULL,
    distill_status TINYINT NOT NULL DEFAULT 0,
    process_status VARCHAR(32) NULL,
    model_version VARCHAR(64) NULL,
    update_time DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_distill_status (distill_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS match_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL UNIQUE,
    user_a VARCHAR(64) NOT NULL,
    user_b VARCHAR(64) NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    a_op VARCHAR(16) NULL,
    b_op VARCHAR(16) NULL,
    unlock_flag TINYINT NOT NULL DEFAULT 0,
    session_id VARCHAR(64) NULL,
    chat_round INT NOT NULL DEFAULT 0,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_a_status (user_a, status),
    INDEX idx_user_b_status (user_b, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS match_report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL UNIQUE,
    score INT NULL,
    dimensions JSON NULL,
    advantage TEXT NULL,
    risk TEXT NULL,
    suggest VARCHAR(512) NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS match_agent_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(64) NULL,
    match_id VARCHAR(64) NOT NULL,
    speaker VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match_created (match_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS human_chat_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(64) NULL,
    match_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_match_created (match_id, created_at),
    INDEX idx_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
