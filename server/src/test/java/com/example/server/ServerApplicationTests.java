package com.example.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

// ZITADEL_ISSUER_URI has no default (see application.yml) so it must be set for the property
// placeholder to resolve at all; the mocked JwtDecoder below then stops the auto-configured one
// from actually fetching that (fake) issuer's OIDC discovery document over the network.
@SpringBootTest
@TestPropertySource(properties = "ZITADEL_ISSUER_URI=https://example-test-issuer.invalid")
class ServerApplicationTests {

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
