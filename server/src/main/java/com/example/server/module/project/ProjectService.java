package com.example.server.module.project;

import com.example.server.audit.AuditService;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.module.project.dto.CreateProjectRequest;
import com.example.server.module.project.dto.UpdateProjectRequest;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectMapper projectMapper;
    private final AuditService auditService;

    public PageResponse<Project> search(UUID departmentId, String status, PageRequest pageRequest) {
        AuthenticatedUser actor = CurrentUser.get();
        UUID effectiveDepartmentId = actor.hasPermission("project.view.all_departments") ? departmentId : actor.departmentId();
        List<Project> content = projectMapper.search(effectiveDepartmentId, status, pageRequest.size(), pageRequest.offset());
        long total = projectMapper.count(effectiveDepartmentId, status);
        return PageResponse.of(content, pageRequest, total);
    }

    public Project getById(UUID id) {
        Project project = requireProject(id);
        requireVisibility(project);
        return project;
    }

    /** Loads a project and enforces department visibility -- the shared check used by milestone/task. */
    public Project requireVisibleProject(UUID id) {
        Project project = requireProject(id);
        requireVisibility(project);
        return project;
    }

    public long countByDepartmentAndStatus(UUID departmentId, String status) {
        return projectMapper.count(departmentId, status);
    }

    public Project create(CreateProjectRequest request) {
        AuthenticatedUser actor = CurrentUser.get();
        if (!actor.hasPermission("project.view.all_departments") && !request.departmentId().equals(actor.departmentId())) {
            throw new ForbiddenException("PMs can only create projects in their own department");
        }
        UUID ownerId = request.ownerId() != null ? request.ownerId() : actor.userId();
        UUID projectId = UUID.randomUUID();
        projectMapper.insert(projectId, request.name(), request.departmentId(), ownerId,
            request.status() != null ? request.status() : "PLANNING", request.startDate(), request.endDate());
        auditService.record("CREATE_PROJECT", "PROJECT", projectId);
        return projectMapper.findById(projectId);
    }

    public Project update(UUID id, UpdateProjectRequest request) {
        Project existing = requireProject(id);
        requireVisibility(existing);
        projectMapper.update(id, request.name(), request.ownerId(), request.status(), request.startDate(), request.endDate());
        auditService.record("UPDATE_PROJECT", "PROJECT", id);
        return projectMapper.findById(id);
    }

    public void archive(UUID id) {
        Project existing = requireProject(id);
        requireVisibility(existing);
        projectMapper.archive(id);
        auditService.record("ARCHIVE_PROJECT", "PROJECT", id);
    }

    private void requireVisibility(Project project) {
        AuthenticatedUser actor = CurrentUser.get();
        if (!actor.hasPermission("project.view.all_departments") && !project.departmentId().equals(actor.departmentId())) {
            throw new ForbiddenException("Cannot access projects outside your own department");
        }
    }

    private Project requireProject(UUID id) {
        Project project = projectMapper.findById(id);
        if (project == null) {
            throw NotFoundException.of("Project", id);
        }
        return project;
    }
}
