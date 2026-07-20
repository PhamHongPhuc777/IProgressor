package com.example.server.module.project;

import com.example.server.common.ApiResponse;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.module.project.dto.CreateProjectRequest;
import com.example.server.module.project.dto.UpdateProjectRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAuthority('project.view')")
    public ApiResponse<PageResponse<Project>> search(
        @RequestParam(required = false) UUID departmentId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.ok(projectService.search(departmentId, status, PageRequest.of(page, size, null)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('project.view')")
    public ApiResponse<Project> getById(@PathVariable("id") UUID id) {
        return ApiResponse.ok(projectService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('project.crud')")
    public ResponseEntity<ApiResponse<Project>> create(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(projectService.create(request)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('project.crud')")
    public ApiResponse<Project> update(@PathVariable("id") UUID id, @RequestBody UpdateProjectRequest request) {
        return ApiResponse.ok(projectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('project.crud')")
    public ResponseEntity<Void> archive(@PathVariable("id") UUID id) {
        projectService.archive(id);
        return ResponseEntity.noContent().build();
    }
}
