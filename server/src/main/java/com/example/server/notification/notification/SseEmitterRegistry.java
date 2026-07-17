package com.example.server.notification.notification;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory, single-instance registry (see build plan's NFR-4 note -- multi-instance fan-out is
 * out of scope for now). Admin emitters get a copy of every notification, matching API.md's "Admin
 * sees all workspaces" rule for the notification stream.
 */
@Component
public class SseEmitterRegistry {

    private static final Long NO_TIMEOUT = 0L;

    private final Map<UUID, List<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();
    private final List<SseEmitter> adminEmitters = new CopyOnWriteArrayList<>();

    public SseEmitter register(UUID userId, boolean isAdmin) {
        SseEmitter emitter = new SseEmitter(NO_TIMEOUT);
        List<SseEmitter> userEmitters = emittersByUser.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
        userEmitters.add(emitter);
        if (isAdmin) {
            adminEmitters.add(emitter);
        }
        Runnable cleanup = () -> {
            userEmitters.remove(emitter);
            adminEmitters.remove(emitter);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());
        return emitter;
    }

    public void push(UUID userId, boolean recipientIsAdmin, Notification notification) {
        send(emittersByUser.getOrDefault(userId, List.of()), notification);
        if (!recipientIsAdmin) {
            send(adminEmitters, notification);
        }
    }

    private void send(List<SseEmitter> emitters, Notification notification) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
            } catch (IOException | IllegalStateException e) {
                emitter.completeWithError(e);
            }
        }
    }
}
