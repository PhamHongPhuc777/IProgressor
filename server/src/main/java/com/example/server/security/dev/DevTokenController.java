package com.example.server.security.dev;

import com.example.server.common.ApiResponse;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Dev-only convenience: mints a JWT shaped like what Zitadel would issue (sub = zitadel_user_id),
 * so every endpoint can be exercised through the real Spring Security filter chain before Zitadel
 * exists. Not part of the documented API surface (see Markdown/API.md) and unreachable outside the
 * "dev" profile.
 */
@RestController
@Profile("dev")
@RequestMapping("/api/v1/dev")
public class DevTokenController {

    @Value("${app.dev.jwt-secret}")
    private String jwtSecret;

    @Value("${app.dev.jwt-issuer}")
    private String issuer;

    private static final long EXPIRY_SECONDS = 3600;

    public record DevTokenResponse(String accessToken, long expiresIn) {
    }

    @PostMapping("/token")
    public ApiResponse<DevTokenResponse> mintToken(@RequestParam String sub) throws Exception {
        Instant now = Instant.now();

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .subject(sub)
            .issuer(issuer)
            .issueTime(Date.from(now))
            .expirationTime(Date.from(now.plusSeconds(EXPIRY_SECONDS)))
            .build();

        JWSSigner signer = new MACSigner(jwtSecret.getBytes(StandardCharsets.UTF_8));
        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        signedJWT.sign(signer);

        return ApiResponse.ok(new DevTokenResponse(signedJWT.serialize(), EXPIRY_SECONDS));
    }
}
