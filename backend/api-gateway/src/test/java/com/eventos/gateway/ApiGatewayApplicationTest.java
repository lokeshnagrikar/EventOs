package com.eventos.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.data.redis.repositories.enabled=false"
})
public class ApiGatewayApplicationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    public void contextLoads() {
    }

    @Test
    public void testPublicRouteBypassesAuth() {
        webTestClient.post()
                .uri("/api/v1/auth/login")
                .bodyValue("{\"email\":\"test@test.com\",\"password\":\"pass\"}")
                .exchange()
                .expectStatus().value(status -> {
                    // Gateway will attempt to route it downstream and return 503/404 since downstream is down,
                    // but it will NOT block it with a 401 Unauthorized response from JwtAuthFilter.
                    org.junit.jupiter.api.Assertions.assertNotEquals(HttpStatus.UNAUTHORIZED.value(), status);
                });
    }

    @Test
    public void testProtectedRouteReturnsUnauthorizedWithoutToken() {
        webTestClient.get()
                .uri("/api/v1/gallery/albums")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
