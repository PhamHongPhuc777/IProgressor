package com.example.server.module.message.broadcast;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.UUID;

@Mapper
public interface BroadcastMapper {

    void insert(@Param("broadcastId") UUID broadcastId, @Param("departmentId") UUID departmentId,
                @Param("authorId") UUID authorId, @Param("content") String content);

    BroadcastMessage findById(@Param("broadcastId") UUID broadcastId);
}
