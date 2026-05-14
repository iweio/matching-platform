package com.matching.platform.mapper;

import com.matching.platform.entity.AppUser;
import org.apache.ibatis.annotations.Param;

public interface AppUserMapper {

    AppUser findByUserId(@Param("userId") String userId);

    AppUser findByPhone(@Param("phone") String phone);

    int insert(AppUser row);

    AppUser findPartnerCandidate(@Param("selfUserId") String selfUserId, @Param("selfGender") Integer selfGender);

    long countMatchesForUser(@Param("userId") String userId);

    long countUnlocksForUser(@Param("userId") String userId);
}
