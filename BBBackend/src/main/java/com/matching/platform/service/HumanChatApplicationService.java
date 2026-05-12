package com.matching.platform.service;

import com.matching.platform.common.BusinessException;
import com.matching.platform.common.ErrorCodes;
import com.matching.platform.dto.chat.ChatListResponse;
import com.matching.platform.dto.chat.ChatSendRequest;
import com.matching.platform.dto.chat.ChatSendResponse;
import com.matching.platform.dto.chat.HumanChatItem;
import com.matching.platform.entity.HumanChatMessage;
import com.matching.platform.entity.MatchRecord;
import com.matching.platform.mapper.HumanChatMessageMapper;
import com.matching.platform.mapper.MatchRecordMapper;
import com.matching.platform.util.TimeUtil;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HumanChatApplicationService {

    private final MatchRecordMapper matchRecordMapper;
    private final HumanChatMessageMapper humanChatMessageMapper;

    @Transactional
    public ChatSendResponse send(ChatSendRequest req) {
        MatchRecord m = matchRecordMapper.findByMatchId(req.getMatchId());
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (m.getUnlockFlag() == null
                || m.getUnlockFlag() != 1
                || m.getStatus() == null
                || m.getStatus() != 5) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "未解锁不可发送真人消息");
        }
        if (!req.getSenderId().equals(m.getUserA()) && !req.getSenderId().equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "发送者不属于该匹配");
        }
        HumanChatMessage msg = new HumanChatMessage();
        msg.setMatchId(req.getMatchId());
        msg.setSenderId(req.getSenderId());
        msg.setContent(req.getContent());
        msg.setCreatedAt(LocalDateTime.now());
        msg.setMessageId(null);
        humanChatMessageMapper.insert(msg);
        String finalId = "chat_msg_" + msg.getId();
        humanChatMessageMapper.updateMessageId(msg.getId(), finalId);
        return new ChatSendResponse(finalId, TimeUtil.format(msg.getCreatedAt()));
    }

    public ChatListResponse list(String matchId, String userId, int page, int pageSize) {
        MatchRecord m = matchRecordMapper.findByMatchId(matchId);
        if (m == null) {
            throw new BusinessException(ErrorCodes.NOT_FOUND, "匹配不存在");
        }
        if (!userId.equals(m.getUserA()) && !userId.equals(m.getUserB())) {
            throw new BusinessException(ErrorCodes.FORBIDDEN, "无权查看聊天记录");
        }
        if (page < 1) {
            page = 1;
        }
        if (pageSize < 1) {
            pageSize = 20;
        }
        int offset = (page - 1) * pageSize;
        long total = humanChatMessageMapper.countByMatchId(matchId);
        List<HumanChatMessage> rows = humanChatMessageMapper.findPage(matchId, offset, pageSize);
        List<HumanChatItem> items = new ArrayList<>();
        for (HumanChatMessage row : rows) {
            String id =
                    row.getMessageId() != null && !row.getMessageId().isBlank()
                            ? row.getMessageId()
                            : ("chat_msg_" + row.getId());
            items.add(
                    new HumanChatItem(
                            id, row.getSenderId(), row.getContent(), TimeUtil.format(row.getCreatedAt())));
        }
        ChatListResponse resp = new ChatListResponse();
        resp.setMessages(items);
        resp.setPage(page);
        resp.setTotal(total);
        return resp;
    }
}
