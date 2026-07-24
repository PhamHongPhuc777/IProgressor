package com.example.server.module.project.me;

import com.example.server.module.project.me.dto.MyStats;
import com.example.server.module.project.me.dto.MyTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface MeStatsMapper {

    MyStats findStats(@Param("userId") UUID userId);

    List<MyTask> findMyTasks(@Param("userId") UUID userId, @Param("limit") int limit);
}
