package com.matching.platform.mapper;

import com.matching.platform.entity.UserAgent;
import org.apache.ibatis.annotations.Param;

public interface UserAgentMapper {

    UserAgent findByUserId(@Param("userId") String userId);

    UserAgent findByAgentId(@Param("agentId") String agentId);

    int insert(UserAgent row);

    int updateModelVersion(@Param("agentId") String agentId, @Param("modelVersion") String modelVersion);
}
