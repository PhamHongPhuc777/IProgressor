package com.example.server.task.task;

import com.example.server.common.ApiResponse;
import com.example.server.task.tag.dto.AddTagRequest;
import com.example.server.task.task.dto.CreateTaskRequest;
import com.example.server.task.task.dto.TaskView;
import com.example.server.task.task.dto.UpdateTaskRequest;
import com.example.server.task.task.dto.UpdateTaskStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasAuthority('project.view')")
    public ApiResponse<List<TaskView>> listByProject(
        @PathVariable("projectId") UUID projectId,
        @RequestParam(required = false) String include
    ) {
        return ApiResponse.ok(taskService.listByProject(projectId));
    }

    @PostMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasAuthority('task.crud')")
    public ResponseEntity<ApiResponse<TaskView>> create(
        @PathVariable("projectId") UUID projectId, @Valid @RequestBody CreateTaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(taskService.create(projectId, request)));
    }

    @GetMapping("/tasks/{id}")
    @PreAuthorize("hasAuthority('project.view')")
    public ApiResponse<TaskView> getById(@PathVariable("id") UUID id) {
        return ApiResponse.ok(taskService.getById(id));
    }

    @PatchMapping("/tasks/{id}")
    @PreAuthorize("hasAuthority('task.crud')")
    public ApiResponse<TaskView> update(@PathVariable("id") UUID id, @RequestBody UpdateTaskRequest request) {
        return ApiResponse.ok(taskService.update(id, request));
    }

    @PatchMapping("/tasks/{id}/status")
    @PreAuthorize("hasAuthority('task.status.update')")
    public ApiResponse<TaskView> updateStatus(@PathVariable("id") UUID id, @Valid @RequestBody UpdateTaskStatusRequest request) {
        return ApiResponse.ok(taskService.updateStatus(id, request));
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasAuthority('task.crud')")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{id}/tags")
    @PreAuthorize("hasAuthority('task.crud')")
    public ApiResponse<TaskView> addTag(@PathVariable("id") UUID id, @Valid @RequestBody AddTagRequest request) {
        return ApiResponse.ok(taskService.addTag(id, request.name()));
    }

    @DeleteMapping("/tasks/{id}/tags/{tagId}")
    @PreAuthorize("hasAuthority('task.crud')")
    public ApiResponse<TaskView> removeTag(@PathVariable("id") UUID id, @PathVariable("tagId") UUID tagId) {
        return ApiResponse.ok(taskService.removeTag(id, tagId));
    }
}
