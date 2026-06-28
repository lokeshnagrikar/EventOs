package com.eventos.event.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitConfig {

    private final Bucket4jFilter bucket4jFilter;

    public RateLimitConfig(Bucket4jFilter bucket4jFilter) {
        this.bucket4jFilter = bucket4jFilter;
    }

    @Bean
    public FilterRegistrationBean<Bucket4jFilter> rateLimitFilter() {
        FilterRegistrationBean<Bucket4jFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(bucket4jFilter);
        registrationBean.addUrlPatterns("/calculator", "/calculator/*");
        registrationBean.setOrder(1); // Execute early in filter chain
        return registrationBean;
    }
}
