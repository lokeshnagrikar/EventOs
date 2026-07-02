package com.eventos.gallery.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Cache configs
        cacheConfigurations.put("albums", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put("gallery-items", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("share-links", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean("tenantAwareKeyGenerator")
    @Override
    public KeyGenerator keyGenerator() {
        return (target, method, params) -> {
            UUID tenantId = TenantContext.getTenantId();
            String prefix = (tenantId != null) ? tenantId.toString() : "global";
            
            StringBuilder sb = new StringBuilder();
            sb.append(prefix).append(":");
            sb.append(target.getClass().getSimpleName()).append(":");
            sb.append(method.getName());
            for (Object param : params) {
                if (param != null) {
                    sb.append(":").append(param.toString());
                }
            }
            return sb.toString();
        };
    }
}
