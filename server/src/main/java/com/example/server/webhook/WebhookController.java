package com.example.server.webhook;

import com.example.server.webhook.dto.NetbirdConnectionEventPayload;
import com.example.server.webhook.dto.ZitadelUserEventPayload;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Guarded by WebhookSharedSecretFilter, not JWT -- see SecurityConfig. */
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/zitadel/user-events")
    public ResponseEntity<Void> zitadelUserEvent(@Valid @RequestBody ZitadelUserEventPayload payload) {
        webhookService.handleZitadelUserEvent(payload);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/netbird/connection-events")
    public ResponseEntity<Void> netbirdConnectionEvent(@Valid @RequestBody NetbirdConnectionEventPayload payload) {
        webhookService.handleNetbirdConnectionEvent(payload);
        return ResponseEntity.noContent().build();
    }
}
