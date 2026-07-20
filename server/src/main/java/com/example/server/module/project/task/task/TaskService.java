package com.example.server.module.project.task.task;

import com.example.server.audit.AuditService;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.module.project.ProjectService;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.module.project.task.tag.Tag;
import com.example.server.module.project.task.tag.TagService;
import com.example.server.module.project.task.task.dto.CreateTaskRequest;
import com.example.server.module.project.task.task.dto.TaskRow;
import com.example.server.module.project.task.task.dto.TaskTagRow;
import com.example.server.module.project.task.task.dto.TaskView;
import com.example.server.module.project.task.task.dto.UpdateTaskRequest;
import com.example.server.module.project.task.task.dto.UpdateTaskStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;
    private final TagService tagService;
    private final ProjectService projectService;
    private final AuditService auditService;

    public List<TaskView> listByProject(UUID projectId) {
        requireProjectVisible(projectId);
        List<TaskRow> rows = taskMapper.findByProject(projectId);
        Map<UUID, List<String>> tagsByTask = new HashMap<>();
        for (TaskTagRow tagRow : taskMapper.findTagsByProject(projectId)) {
            tagsByTask.computeIfAbsent(tagRow.taskId(), k -> new java.util.ArrayList<>()).add(tagRow.tagName());
        }
        return rows.stream()
            .map(row -> TaskView.of(row, tagsByTask.getOrDefault(row.taskId(), List.of())))
            .toList();
    }

    public TaskView getById(UUID taskId) {
        TaskRow row = requireTask(taskId);
        requireProjectVisible(row.projectId());
        return TaskView.of(row, taskMapper.findTagsByTask(taskId));
    }

    public TaskView create(UUID projectId, CreateTaskRequest request) {
        requireProjectVisible(projectId);
        if (request.parentTaskId() != null) {
            requireTask(request.parentTaskId());
        }
        UUID taskId = UUID.randomUUID();
        taskMapper.insert(taskId, projectId, request.milestoneId(), request.parentTaskId(), request.assigneeId(),
            request.title(), request.description(), request.startDate(), request.dueDate(),
            request.status(), request.priority());
        auditService.record("CREATE_TASK", "TASK", taskId);
        return getById(taskId);
    }

    public TaskView update(UUID taskId, UpdateTaskRequest request) {
        TaskRow row = requireTask(taskId);
        requireProjectVisible(row.projectId());
        taskMapper.update(taskId, request.title(), request.description(), request.milestoneId(), request.assigneeId(),
            request.startDate(), request.dueDate(), request.status(), request.priority());
        auditService.record("UPDATE_TASK", "TASK", taskId);
        return getById(taskId);
    }

    public TaskView updateStatus(UUID taskId, UpdateTaskStatusRequest request) {
        TaskRow row = requireTask(taskId);
        requireProjectVisible(row.projectId());
        AuthenticatedUser actor = CurrentUser.get();
        if (!actor.hasPermission("task.crud") && !actor.userId().equals(row.assigneeId())) {
            throw new ForbiddenException("Staff may only update the status of tasks assigned to them");
        }
        taskMapper.updateStatus(taskId, request.status());
        auditService.record("UPDATE_TASK_STATUS", "TASK", taskId);
        return getById(taskId);
    }

    public void delete(UUID taskId) {
        TaskRow row = requireTask(taskId);
        requireProjectVisible(row.projectId());
        taskMapper.delete(taskId);
        auditService.record("DELETE_TASK", "TASK", taskId);
    }

    public TaskView addTag(UUID taskId, String tagName) {
        TaskRow row = requireTask(taskId);
        requireProjectVisible(row.projectId());
        Tag tag = tagService.findOrCreate(tagName);
        taskMapper.addTag(taskId, tag.tagId());
        return getById(taskId);
    }

    public TaskView removeTag(UUID taskId, UUID tagId) {
        TaskRow row = requireTask(taskId);
        requireProjectVisible(row.projectId());
        taskMapper.removeTag(taskId, tagId);
        return getById(taskId);
    }

    /** Public: also called from the sibling attachment/comment packages. */
    public void requireProjectVisible(UUID projectId) {
        projectService.requireVisibleProject(projectId);
    }

    /** Public: also called from the sibling attachment/comment packages. */
    public TaskRow requireTask(UUID taskId) {
        TaskRow row = taskMapper.findById(taskId);
        if (row == null) {
            throw NotFoundException.of("Task", taskId);
        }
        return row;
    }
}
