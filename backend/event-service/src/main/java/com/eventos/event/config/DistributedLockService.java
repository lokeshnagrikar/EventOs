package com.eventos.event.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class DistributedLockService {

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    public boolean acquireLock(String lockKey, Duration expireTime) {
        if (redisTemplate == null) {
            return true;
        }
        try {
            Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", expireTime);
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            return true; 
        }
    }

    public void releaseLock(String lockKey) {
        if (redisTemplate == null) {
            return;
        }
        try {
            redisTemplate.delete(lockKey);
        } catch (Exception ignored) {}
    }
}
