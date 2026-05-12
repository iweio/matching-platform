package com.matching.platform.service;

import com.matching.platform.entity.MatchAgentMessage;
import com.matching.platform.mapper.MatchAgentMessageMapper;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MatchMessageWriter {

    private final MatchAgentMessageMapper matchAgentMessageMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void append(String matchId, String speaker, String content) {
        MatchAgentMessage m = new MatchAgentMessage();
        m.setMatchId(matchId);
        m.setSpeaker(speaker);
        m.setContent(content);
        m.setCreatedAt(LocalDateTime.now());
        m.setMessageId(null);
        matchAgentMessageMapper.insert(m);
        matchAgentMessageMapper.updateMessageId(m.getId(), "msg_" + m.getId());
    }
}
