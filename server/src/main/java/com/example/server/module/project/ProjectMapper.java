package com.example.server.module.project;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Mapper
public interface ProjectMapper {

    Project findById(@Param("projectId") UUID projectId);

    List<Project> search(@Param("departmentId") UUID departmentId, @Param("status") String status,
                          @Param("limit") int limit, @Param("offset") int offset);

    long count(@Param("departmentId") UUID departmentId, @Param("status") String status);

    void insert(@Param("projectId") UUID projectId, @Param("name") String name, @Param("departmentId") UUID departmentId,
                @Param("ownerId") UUID ownerId, @Param("status") String status,
                @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    void update(@Param("projectId") UUID projectId, @Param("name") String name, @Param("ownerId") UUID ownerId,
                @Param("status") String status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    void archive(@Param("projectId") UUID projectId);
}
