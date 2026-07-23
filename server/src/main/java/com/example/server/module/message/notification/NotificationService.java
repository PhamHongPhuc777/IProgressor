package com.example.server.module.message.notification;

import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.module.workspace.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final UserService userService;
    private final SseEmitterRegistry emitterRegistry;

    public PageResponse<Notification> list(PageRequest pageRequest) {
        AuthenticatedUser actor = CurrentUser.get();
        List<Notification> content;
        long total;
        if (actor.isAdmin()) {
            content = notificationMapper.findAll(pageRequest.size(), pageRequest.offset());
            total = notificationMapper.countAll();
        } else {
            content = notificationMapper.findByUser(actor.userId(), pageRequest.size(), pageRequest.offset());
            total = notificationMapper.countByUser(actor.userId());
        }
        return PageResponse.of(content, pageRequest, total);
    }

    public SseEmitter stream() {
        AuthenticatedUser actor = CurrentUser.get();
        return emitterRegistry.register(actor.userId(), actor.isAdmin());
    }

    public void markRead(UUID notificationId) {
        AuthenticatedUser actor = CurrentUser.get();
        Notification notification = notificationMapper.findById(notificationId);
        if (notification == null) {
            throw NotFoundException.of("Notification", notificationId);
        }
        if (!notification.userId().equals(actor.userId())) {
            throw new ForbiddenException("Cannot mark another user's notification as read");
        }
        notificationMapper.markRead(notificationId, actor.userId());
    }

    /** Creates one notification for a user and pushes it over SSE if they're connected. */
    public void notifyUser(UUID userId, String entityType, UUID entityId) {
        UUID notificationId = UUID.randomUUID();
        notificationMapper.insert(notificationId, userId, entityType, entityId);
        Notification notification = notificationMapper.findById(notificationId);
        boolean recipientIsAdmin = "Admin".equals(userService.getSummary(userId).roleName());
        emitterRegistry.push(userId, recipientIsAdmin, notification);
    }

    /** Fans a notification out to every user in a department -- used by BroadcastService. */
    public void notifyDepartment(UUID departmentId, String entityType, UUID entityId) {
        for (UUID recipientId : userService.getUserIdsByDepartment(departmentId)) {
            notifyUser(recipientId, entityType, entityId);
        }
    }
}
