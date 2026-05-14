package com.matching.platform.mapper;

import com.matching.platform.entity.MatchRecord;
import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Param;

public interface MatchRecordMapper {

    int insert(MatchRecord row);

    int update(MatchRecord row);

    MatchRecord findByMatchId(@Param("matchId") String matchId);

    List<MatchRecord> findActiveForUser(@Param("userId") String userId);

    int countActiveForUser(@Param("userId") String userId);

    List<Map<String, Object>> findConversationsByUserId(@Param("userId") String userId);

    List<Map<String, Object>> findHistoryByUserId(@Param("userId") String userId);
}
