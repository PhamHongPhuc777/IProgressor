package com.example.server.module.project.message.notification;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface NotificationMapper {

    Notification findById(@Param("notificationId") UUID notificationId);

    List<Notification> findByUser(@Param("userId") UUID userId, @Param("limit") int limit, @Param("offset") int offset);

    long countByUser(@Param("userId") UUID userId);

    List<Notification> findAll(@Param("limit") int limit, @Param("offset") int offset);

    long countAll();

    void insert(@Param("notificationId") UUID notificationId, @Param("userId") UUID userId,
                @Param("entityType") String entityType, @Param("entityId") UUID entityId);

    void markRead(@Param("notificationId") UUID notificationId, @Param("userId") UUID userId);
}
