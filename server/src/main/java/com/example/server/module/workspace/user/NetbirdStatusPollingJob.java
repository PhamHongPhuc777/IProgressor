package com.example.server.module.workspace.user;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * NetBird Cloud doesn't yet emit peer-connection webhooks (only peer-updates/user-approvals/
 * sync-token-expiry), so users.netbird_connected/netbird_last_seen can't be kept live by an
 * inbound event -- this polls NetBird's own /api/peers on a fixed delay instead.
 */
@Component
@RequiredArgsConstructor
public class NetbirdStatusPollingJob {

    private final UserService userService;

    @Scheduled(fixedDelay = 60_000)
    public void poll() {
        userService.syncNetbirdStatusFromPolling();
    }
}
