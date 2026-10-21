package com.eventos.gallery.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Enterprise client IP resolver that prevents IP spoofing behind reverse proxies (Caddy, Spring Cloud Gateway).
 *
 * Anti-spoofing mechanism:
 * 1. Validates that the immediate socket peer (remoteAddr) is in the trusted proxy set.
 *    If the caller is NOT a trusted proxy, headers like X-Forwarded-For and X-Real-IP are untrusted and discarded.
 * 2. If the peer IS trusted, it parses X-Forwarded-For from right-to-left (the order added by hops),
 *    stopping at the first untrusted IP address.
 * 3. Strictly validates IPv4/IPv6 syntax using regex patterns to block injection.
 */
@Component
public class ClientIpResolver {

    private static final Logger log = LoggerFactory.getLogger(ClientIpResolver.class);

    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.){3}(25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)$"
    );

    private static final Pattern IPV6_PATTERN = Pattern.compile(
            "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|" +
            "^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$"
    );

    private final Set<String> trustedProxies;

    public ClientIpResolver(@Value("${app.security.trusted-proxies:127.0.0.1,::1,0:0:0:0:0:0:0:1,localhost}") String trustedProxiesConfig) {
        this.trustedProxies = new HashSet<>();
        if (trustedProxiesConfig != null) {
            Arrays.stream(trustedProxiesConfig.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(this.trustedProxies::add);
        }
        // Always include loopback
        this.trustedProxies.add("127.0.0.1");
        this.trustedProxies.add("::1");
        this.trustedProxies.add("0:0:0:0:0:0:0:1");
    }

    public String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.trim().isEmpty()) {
            return "127.0.0.1";
        }
        remoteAddr = remoteAddr.trim();

        // If direct caller is NOT trusted proxy, do NOT trust any forwarded headers
        if (!isTrustedProxy(remoteAddr)) {
            return isValidIp(remoteAddr) ? remoteAddr : "unknown";
        }

        // Caller is trusted (Caddy or API Gateway) - inspect X-Forwarded-For
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            String[] ips = xForwardedFor.split(",");
            // Parse from right to left (last hop backwards)
            for (int i = ips.length - 1; i >= 0; i--) {
                String candidate = ips[i].trim();
                if (isValidIp(candidate)) {
                    if (!isTrustedProxy(candidate) || i == 0) {
                        return candidate;
                    }
                }
            }
        }

        // Fallback to X-Real-IP if present and valid
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.trim().isEmpty()) {
            String candidate = xRealIp.trim();
            if (isValidIp(candidate)) {
                return candidate;
            }
        }

        return isValidIp(remoteAddr) ? remoteAddr : "unknown";
    }

    public boolean isTrustedProxy(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }
        String cleanIp = ip.trim();

        if (trustedProxies.contains(cleanIp)) {
            return true;
        }

        // Check if loopback or private RFC 1918 addresses
        try {
            InetAddress address = InetAddress.getByName(cleanIp);
            if (address.isLoopbackAddress() || address.isSiteLocalAddress()) {
                return true;
            }
        } catch (Exception ignored) {
            // Unparseable host
        }

        return false;
    }

    public boolean isValidIp(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }
        String cleanIp = ip.trim();
        return IPV4_PATTERN.matcher(cleanIp).matches() || IPV6_PATTERN.matcher(cleanIp).matches();
    }
}
