package com.example.server.module.project.milestone;

import com.example.server.common.ApiResponse;
import com.example.server.module.project.milestone.dto.CreateMilestoneRequest;
import com.example.server.module.project.milestone.dto.UpdateMilestoneRequest;
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
public class MilestoneController {

    private final MilestoneService milestoneService;

    @GetMapping("/projects/{projectId}/milestones")
    @PreAuthorize("hasAuthority('project.view')")
    public ApiResponse<List<Milestone>> list(@PathVariable("projectId") UUID projectId) {
        return ApiResponse.ok(milestoneService.listByProject(projectId));
    }

    @PostMapping("/projects/{projectId}/milestones")
    @PreAuthorize("hasAuthority('milestone.crud')")
    public ResponseEntity<ApiResponse<Milestone>> create(
        @PathVariable("projectId") UUID projectId, @Valid @RequestBody CreateMilestoneRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(milestoneService.create(projectId, request)));
    }

    @PatchMapping("/milestones/{id}")
    @PreAuthorize("hasAuthority('milestone.crud')")
    public ApiResponse<Milestone> update(@PathVariable("id") UUID id, @RequestBody UpdateMilestoneRequest request) {
        return ApiResponse.ok(milestoneService.update(id, request));
    }

    @DeleteMapping("/milestones/{id}")
    @PreAuthorize("hasAuthority('milestone.crud')")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        milestoneService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
