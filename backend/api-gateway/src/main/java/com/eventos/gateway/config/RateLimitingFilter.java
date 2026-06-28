package com.eventos.gateway.config;

import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
@SuppressWarnings("null")
public class RateLimitingFilter implements GlobalFilter, Ordered {

    private final ReactiveStringRedisTemplate redisTemplate;

    public RateLimitingFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        java.net.InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        String ip = (remoteAddress != null && remoteAddress.getAddress() != null)
                ? remoteAddress.getAddress().getHostAddress()
                : "unknown";
        
        String key = "gateway:rate:limit:ip:" + ip;
        
        // Rate limit: 100 requests per minute
        return redisTemplate.opsForValue().increment(key)
                .flatMap(current -> {
                    if (current == 1) {
                        return redisTemplate.expire(key, Duration.ofMinutes(1))
                                .then(chain.filter(exchange));
                    }
                    if (current > 100) {
                        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
                        String body = "{\"success\":false,\"error\":{\"code\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded. Try again in a minute.\"}}";
                        byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
                    }
                    return chain.filter(exchange);
                })
                .onErrorResume(e -> {
                    // Fallback to ensure high-availability if Redis is down
                    return chain.filter(exchange);
                });
    }

    @Override
    public int getOrder() {
        return -5; // Executes before JwtAuthFilter
    }
}
