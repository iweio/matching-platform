package com.matching.platform.mapper;

import com.matching.platform.entity.HumanChatMessage;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface HumanChatMessageMapper {

    int insert(HumanChatMessage row);

    int updateMessageId(@Param("id") Long id, @Param("messageId") String messageId);

    List<HumanChatMessage> findPage(
            @Param("matchId") String matchId,
            @Param("offset") int offset,
            @Param("pageSize") int pageSize);

    long countByMatchId(@Param("matchId") String matchId);
}
