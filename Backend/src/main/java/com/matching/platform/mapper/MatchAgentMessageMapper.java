package com.matching.platform.mapper;

import com.matching.platform.entity.MatchAgentMessage;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface MatchAgentMessageMapper {

    int insert(MatchAgentMessage row);

    int updateMessageId(@Param("id") Long id, @Param("messageId") String messageId);

    List<MatchAgentMessage> findAfterId(
            @Param("matchId") String matchId,
            @Param("afterId") long afterId,
            @Param("limit") int limit);

    long countByMatchId(@Param("matchId") String matchId);
}
