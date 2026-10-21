package com.eventos.gallery.security;

import com.eventos.gallery.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Redis-backed brute-force rate limiter for shared album passcodes.
 *
 * Rules:
 * - Key by: shareToken + clientIp
 * - 5 consecutive failures -> lock for 30 minutes (1800 seconds), return HTTP 429 with Retry-After
 * - Reset counter on successful passcode verification
 * - Global per-token limit: 50 failures / 1 hour regardless of IP to protect against distributed botnets
 */
@Component
public class ShareLinkRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(ShareLinkRateLimiter.class);

    public static final int MAX_IP_FAILURES = 5;
    public static final long IP_LOCKOUT_SECONDS = 1800L; // 30 minutes
    public static final int MAX_GLOBAL_FAILURES = 50;
    public static final long GLOBAL_WINDOW_SECONDS = 3600L; // 1 hour

    private static final String KEY_PREFIX = "gallery:share:";
    private static final String KEY_FAIL = KEY_PREFIX + "fail:";
    private static final String KEY_LOCK = KEY_PREFIX + "lock:";
    private static final String KEY_GLOBAL_FAIL = KEY_PREFIX + "global_fail:";
    private static final String KEY_GLOBAL_LOCK = KEY_PREFIX + "global_lock:";

    private final StringRedisTemplate redisTemplate;

    // In-memory fallback in case Redis is not configured or in lightweight testing
    private final ConcurrentHashMap<String, Long> memoryFailures = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> memoryLockouts = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public ShareLinkRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public ShareLinkRateLimiter() {
        this.redisTemplate = null;
    }

    /**
     * Checks if the given token or IP is currently locked out before attempting verification.
     */
    public void checkLockout(String shareToken, String clientIp) {
        String safeToken = sanitizeKey(shareToken);
        String safeIp = sanitizeKey(clientIp);

        // 1. Check Global Token Lockout
        String globalLockKey = KEY_GLOBAL_LOCK + safeToken;
        if (isKeyLocked(globalLockKey)) {
            long remaining = getRemainingTtl(globalLockKey, GLOBAL_WINDOW_SECONDS);
            log.warn("Access blocked by global lockout for shareToken={}", safeToken);
            throw new RateLimitExceededException(remaining, "Global passcode attempt limit exceeded. Link temporarily locked.");
        }

        // 2. Check Client IP Lockout
        String ipLockKey = KEY_LOCK + safeToken + ":" + safeIp;
        if (isKeyLocked(ipLockKey)) {
            long remaining = getRemainingTtl(ipLockKey, IP_LOCKOUT_SECONDS);
            log.warn("Access blocked by IP lockout for shareToken={}, clientIp={}", safeToken, safeIp);
            throw new RateLimitExceededException(remaining, "Too many failed passcode attempts. Locked for 30 minutes.");
        }
    }

    /**
     * Records a failed passcode verification attempt.
     * Increments per-IP and per-token counters and triggers lockouts when thresholds are exceeded.
     */
    public void recordFailure(String shareToken, String clientIp) {
        String safeToken = sanitizeKey(shareToken);
        String safeIp = sanitizeKey(clientIp);

        // 1. Increment Global Failures
        String globalFailKey = KEY_GLOBAL_FAIL + safeToken;
        String globalLockKey = KEY_GLOBAL_LOCK + safeToken;
        long globalCount = incrementWithTtl(globalFailKey, GLOBAL_WINDOW_SECONDS);
        if (globalCount >= MAX_GLOBAL_FAILURES) {
            setLock(globalLockKey, GLOBAL_WINDOW_SECONDS);
            log.warn("Share token {} reached global failure threshold ({}/{}). Locked for {}s.",
                    safeToken, globalCount, MAX_GLOBAL_FAILURES, GLOBAL_WINDOW_SECONDS);
            throw new RateLimitExceededException(GLOBAL_WINDOW_SECONDS,
                    "Global passcode attempt limit exceeded. Link temporarily locked.");
        }

        // 2. Increment IP Failures
        String ipFailKey = KEY_FAIL + safeToken + ":" + safeIp;
        String ipLockKey = KEY_LOCK + safeToken + ":" + safeIp;
        long ipCount = incrementWithTtl(ipFailKey, IP_LOCKOUT_SECONDS);
        if (ipCount >= MAX_IP_FAILURES) {
            setLock(ipLockKey, IP_LOCKOUT_SECONDS);
            log.warn("Client IP {} reached failure threshold ({}/{}) for token {}. Locked for 30 minutes.",
                    safeIp, ipCount, MAX_IP_FAILURES, safeToken);
            throw new RateLimitExceededException(IP_LOCKOUT_SECONDS,
                    "Too many failed passcode attempts. Locked for 30 minutes.");
        }
    }

    /**
     * Resets the client IP's consecutive failure counter upon successful passcode verification.
     */
    public void recordSuccess(String shareToken, String clientIp) {
        String safeToken = sanitizeKey(shareToken);
        String safeIp = sanitizeKey(clientIp);

        String ipFailKey = KEY_FAIL + safeToken + ":" + safeIp;
        String ipLockKey = KEY_LOCK + safeToken + ":" + safeIp;

        if (redisTemplate != null) {
            try {
                redisTemplate.delete(ipFailKey);
                redisTemplate.delete(ipLockKey);
            } catch (Exception e) {
                log.warn("Redis error on recordSuccess: {}", e.getMessage());
            }
        }
        memoryFailures.remove(ipFailKey);
        memoryLockouts.remove(ipLockKey);
    }

    // --- Helpers ---

    private boolean isKeyLocked(String lockKey) {
        if (redisTemplate != null) {
            try {
                return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey));
            } catch (Exception e) {
                log.warn("Redis error checking lock: {}", e.getMessage());
            }
        }
        Long lockUntil = memoryLockouts.get(lockKey);
        if (lockUntil != null) {
            if (System.currentTimeMillis() < lockUntil) {
                return true;
            } else {
                memoryLockouts.remove(lockKey);
            }
        }
        return false;
    }

    private long getRemainingTtl(String key, long defaultTtl) {
        if (redisTemplate != null) {
            try {
                Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                if (expire != null && expire > 0) {
                    return expire;
                }
            } catch (Exception e) {
                log.warn("Redis error fetching expire: {}", e.getMessage());
            }
        }
        Long lockUntil = memoryLockouts.get(key);
        if (lockUntil != null) {
            long remaining = (lockUntil - System.currentTimeMillis()) / 1000;
            return remaining > 0 ? remaining : defaultTtl;
        }
        return defaultTtl;
    }

    private long incrementWithTtl(String key, long ttlSeconds) {
        if (redisTemplate != null) {
            try {
                Long count = redisTemplate.opsForValue().increment(key);
                if (count != null && count == 1) {
                    redisTemplate.expire(key, Duration.ofSeconds(ttlSeconds));
                }
                return count != null ? count : 1;
            } catch (Exception e) {
                log.warn("Redis error incrementing key: {}", e.getMessage());
            }
        }
        long now = System.currentTimeMillis();
        long newCount = memoryFailures.compute(key, (k, v) -> (v == null ? 1 : v + 1));
        return newCount;
    }

    private void setLock(String key, long ttlSeconds) {
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(key, "LOCKED", Duration.ofSeconds(ttlSeconds));
            } catch (Exception e) {
                log.warn("Redis error setting lock: {}", e.getMessage());
            }
        }
        memoryLockouts.put(key, System.currentTimeMillis() + (ttlSeconds * 1000));
    }

    private String sanitizeKey(String value) {
        if (value == null || value.trim().isEmpty()) {
            return "unknown";
        }
        return value.trim().replaceAll("[^a-zA-Z0-9_.-]", "_");
    }
}
