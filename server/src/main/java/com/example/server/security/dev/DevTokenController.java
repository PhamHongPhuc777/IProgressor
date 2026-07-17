package com.example.server.security.dev;

import com.example.server.common.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Dev-only convenience: exchanges the dev machine user's client credentials for a real
 * Zitadel-issued access token, so the API can be exercised without a browser login flow. Replaces
 * the old HS256 self-signing stub now that dev auth validates against real Zitadel (see
 * application.yml's issuer-uri, now unconditional -- see DevJwtDecoderConfig's removal).
 *
 * The token this mints authenticates as the machine/service user configured via
 * app.zitadel.dev-client-id/dev-client-secret. LocalUserJwtAuthenticationConverter still requires
 * that identity's zitadel_user_id to resolve to a provisioned local `users` row, so exercising a
 * specific human role still requires either a real browser login or provisioning this machine
 * identity as a local user with the desired role.
 */
@RestController
@Profile("dev")
@RequestMapping("/api/v1/dev")
public class DevTokenController {

    private final RestClient restClient = RestClient.create();

    @Value("${app.zitadel.management-api-base-url}")
    private String issuerBaseUrl;

    @Value("${app.zitadel.dev-client-id}")
    private String clientId;

    @Value("${app.zitadel.dev-client-secret}")
    private String clientSecret;

    public record DevTokenResponse(String accessToken, long expiresIn) {
    }

    @PostMapping("/token")
    public ApiResponse<DevTokenResponse> mintToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("scope", "openid profile");

        Map<String, Object> response = restClient.post()
            .uri(issuerBaseUrl + "/oauth/v2/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(Map.class);

        String accessToken = (String) response.get("access_token");
        long expiresIn = ((Number) response.get("expires_in")).longValue();
        return ApiResponse.ok(new DevTokenResponse(accessToken, expiresIn));
    }
}
