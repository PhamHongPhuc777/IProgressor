package com.example.server.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * /webhooks/** is called server-to-server by Zitadel/NetBird, not by a logged-in user, so it's
 * permitAll at the Spring Security layer and guarded here instead by a shared secret header.
 */
@Component
public class WebhookSharedSecretFilter extends OncePerRequestFilter {

    private static final String WEBHOOK_PATH_PREFIX = "/api/v1/webhooks/";
    private static final String SECRET_HEADER = "X-Webhook-Secret";

    @Value("${app.webhook.shared-secret}")
    private String sharedSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getRequestURI().startsWith(WEBHOOK_PATH_PREFIX)) {
            String provided = request.getHeader(SECRET_HEADER);
            if (provided == null || !MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8), sharedSecret.getBytes(StandardCharsets.UTF_8))) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("""
                    {"success":false,"error":{"code":"UNAUTHORIZED","message":"Invalid webhook secret"}}""");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
