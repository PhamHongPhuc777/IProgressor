package com.example.server.webhook;

import com.example.server.webhook.dto.NetbirdConnectionEventPayload;
import com.example.server.webhook.dto.ZitadelUserEventPayload;
import com.example.server.module.workspace.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebhookService {

    private final UserService userService;

    public void handleZitadelUserEvent(ZitadelUserEventPayload payload) {
        String status = "user.locked".equals(payload.eventType()) ? "LOCKED" : "ACTIVE";
        userService.updateStatusByZitadelUserId(payload.zitadelUserId(), status);
    }

    public void handleNetbirdConnectionEvent(NetbirdConnectionEventPayload payload) {
        userService.updateNetbirdStatus(payload.zitadelUserId(), payload.connected(), payload.timestamp());
    }
}
