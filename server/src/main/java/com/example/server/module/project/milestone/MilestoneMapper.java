package com.example.server.milestone;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Mapper
public interface MilestoneMapper {

    Milestone findById(@Param("milestoneId") UUID milestoneId);

    List<Milestone> findByProject(@Param("projectId") UUID projectId);

    void insert(@Param("milestoneId") UUID milestoneId, @Param("projectId") UUID projectId,
                @Param("name") String name, @Param("dueDate") LocalDate dueDate, @Param("status") String status);

    void update(@Param("milestoneId") UUID milestoneId, @Param("name") String name,
                @Param("dueDate") LocalDate dueDate, @Param("status") String status);

    void delete(@Param("milestoneId") UUID milestoneId);
}
