package com.matching.platform.mapper;

import com.matching.platform.entity.UserDistill;
import org.apache.ibatis.annotations.Param;

public interface UserDistillMapper {

    UserDistill findByUserId(String userId);

    int upsert(UserDistill row);

    int updateModelState(
            @Param("userId") String userId,
            @Param("distillStatus") int distillStatus,
            @Param("modelVersion") String modelVersion,
            @Param("processStatus") String processStatus);
}
