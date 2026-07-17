package com.example.server.security.dev;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Stands in for Zitadel's OIDC issuer while no Zitadel instance is running locally. Only active
 * under the "dev" profile; production wires spring.security.oauth2.resourceserver.jwt.issuer-uri
 * against real Zitadel instead (see application.yml's prod profile block).
 */
@Configuration
@Profile("dev")
public class DevJwtDecoderConfig {

    @Value("${app.dev.jwt-secret}")
    private String jwtSecret;

    @Bean
    public JwtDecoder jwtDecoder() {
        var key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }
}
