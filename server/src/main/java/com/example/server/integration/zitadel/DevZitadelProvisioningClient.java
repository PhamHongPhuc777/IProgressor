package com.example.server.integration.zitadel;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile("dev")
public class DevZitadelProvisioningClient implements ZitadelProvisioningClient {

    @Override
    public String provisionUser(String email, String fullName) {
        return "dev-zitadel-" + UUID.randomUUID();
    }
}
