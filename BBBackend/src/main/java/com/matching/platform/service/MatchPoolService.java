package com.matching.platform.service;

import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MatchPoolService {

    private final ConcurrentHashMap<String, PoolEntry> pool = new ConcurrentHashMap<>();

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
