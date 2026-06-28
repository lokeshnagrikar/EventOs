package com.eventos.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String traceId = exchange.getRequest().getHeaders().getFirst("X-Trace-ID");
        String path = exchange.getRequest().getPath().toString();
        String method = exchange.getRequest().getMethod().name();
        java.net.InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        String ip = remoteAddress != null ? remoteAddress.toString() : "unknown";

        log.info("[GATEWAY REQUEST] Trace ID: {}, Method: {}, Path: {}, Client IP: {}", traceId, method, path, ip);

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            log.info("[GATEWAY RESPONSE] Trace ID: {}, Status Code: {}", traceId, exchange.getResponse().getStatusCode());
        }));
    }

    @Override
    public int getOrder() {
        return 0; // Run after JwtAuthFilter so traceId header is populated
    }
}
