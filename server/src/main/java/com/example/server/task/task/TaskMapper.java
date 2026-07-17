package com.example.server.task.task;

import com.example.server.task.task.dto.TaskRow;
import com.example.server.task.task.dto.TaskTagRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Mapper
public interface TaskMapper {

    TaskRow findById(@Param("taskId") UUID taskId);

    List<TaskRow> findByProject(@Param("projectId") UUID projectId);

    List<TaskTagRow> findTagsByProject(@Param("projectId") UUID projectId);

    List<String> findTagsByTask(@Param("taskId") UUID taskId);

    void insert(@Param("taskId") UUID taskId, @Param("projectId") UUID projectId,
                @Param("milestoneId") UUID milestoneId, @Param("parentTaskId") UUID parentTaskId,
                @Param("assigneeId") UUID assigneeId, @Param("title") String title, @Param("description") String description,
                @Param("startDate") LocalDate startDate, @Param("dueDate") LocalDate dueDate,
                @Param("status") String status, @Param("priority") String priority);

    void update(@Param("taskId") UUID taskId, @Param("title") String title, @Param("description") String description,
                @Param("milestoneId") UUID milestoneId, @Param("assigneeId") UUID assigneeId,
                @Param("startDate") LocalDate startDate, @Param("dueDate") LocalDate dueDate,
                @Param("status") String status, @Param("priority") String priority);

    void updateStatus(@Param("taskId") UUID taskId, @Param("status") String status);

    void delete(@Param("taskId") UUID taskId);

    void addTag(@Param("taskId") UUID taskId, @Param("tagId") UUID tagId);

    void removeTag(@Param("taskId") UUID taskId, @Param("tagId") UUID tagId);
}
