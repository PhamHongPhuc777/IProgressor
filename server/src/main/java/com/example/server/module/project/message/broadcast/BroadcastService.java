package com.example.server.module.project.message.broadcast;

import com.example.server.module.project.message.notification.NotificationService;
import com.example.server.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BroadcastService {

    private final BroadcastMapper broadcastMapper;
    private final NotificationService notificationService;

    @Transactional
    public BroadcastMessage broadcast(UUID departmentId, String content) {
        UUID broadcastId = UUID.randomUUID();
        broadcastMapper.insert(broadcastId, departmentId, CurrentUser.get().userId(), content);
        notificationService.notifyDepartment(departmentId, "BROADCAST_MESSAGE", broadcastId);
        return broadcastMapper.findById(broadcastId);
    }
}
