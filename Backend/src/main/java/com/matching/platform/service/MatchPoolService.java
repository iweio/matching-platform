package com.matching.platform.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MatchPoolService {

    private final ConcurrentHashMap<String, PoolEntry> pool = new ConcurrentHashMap<>();
    
    // 记录拒绝关系：key 是用户ID，value 是该用户拒绝过的用户ID集合
    private final ConcurrentMap<String, Set<String>> rejectedUsers = new ConcurrentHashMap<>();

    public boolean isWaiting(String userId) {
        return pool.containsKey(userId);
    }

    public String findAndMatch(String selfUserId, Integer selfGender) {
        // Look for compatible partner (opposite gender)
        for (Map.Entry<String, PoolEntry> e : pool.entrySet()) {
            String candidateId = e.getKey();
            if (candidateId.equals(selfUserId)) {
                continue;
            }
            // 检查是否存在拒绝关系（双向都要检查）
            if (hasRejected(selfUserId, candidateId)) {
                continue;
            }
            Integer candidateGender = e.getValue().gender;
            if (isCompatible(selfGender, candidateGender)) {
                // Found — remove both from pool
                pool.remove(candidateId);
                pool.remove(selfUserId);
                return candidateId;
            }
        }
        return null;
    }
    
    /**
     * 检查两个用户之间是否存在拒绝关系
     * @param userId1 用户1
     * @param userId2 用户2
     * @return 如果存在拒绝关系返回true，否则返回false
     */
    private boolean hasRejected(String userId1, String userId2) {
        Set<String> rejectedBy1 = rejectedUsers.get(userId1);
        Set<String> rejectedBy2 = rejectedUsers.get(userId2);
        return (rejectedBy1 != null && rejectedBy1.contains(userId2)) 
            || (rejectedBy2 != null && rejectedBy2.contains(userId1));
    }
    
    /**
     * 记录拒绝关系（双向）
     * @param rejecterId 拒绝者ID
     * @param rejectedId 被拒绝者ID
     */
    public void recordRejection(String rejecterId, String rejectedId) {
        // 记录拒绝者 -> 被拒绝者
        rejectedUsers.computeIfAbsent(rejecterId, k -> new HashSet<>()).add(rejectedId);
        // 记录被拒绝者 -> 拒绝者（双向拒绝）
        rejectedUsers.computeIfAbsent(rejectedId, k -> new HashSet<>()).add(rejecterId);
    }

    public void join(String userId, Integer gender) {
        pool.put(userId, new PoolEntry(gender));
    }

    public void leave(String userId) {
        pool.remove(userId);
    }

    private boolean isCompatible(Integer gender1, Integer gender2) {
        if (gender1 == null || gender2 == null) {
            return true;
        }
        return !gender1.equals(gender2);
    }

    @Scheduled(fixedRate = 30_000)
    public void cleanExpired() {
        long now = Instant.now().toEpochMilli();
        Iterator<Map.Entry<String, PoolEntry>> it = pool.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, PoolEntry> e = it.next();
            if (now - e.getValue().joinedAt > 300_000) { // 5 min timeout
                it.remove();
            }
        }
    }

    private static class PoolEntry {
        final Integer gender;
        final long joinedAt;

        PoolEntry(Integer gender) {
            this.gender = gender;
            this.joinedAt = Instant.now().toEpochMilli();
        }
    }
}
