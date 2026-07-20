package com.example.server.module.project.milestone;

import com.example.server.audit.AuditService;
import com.example.server.common.exception.NotFoundException;
import com.example.server.module.project.milestone.dto.CreateMilestoneRequest;
import com.example.server.module.project.milestone.dto.UpdateMilestoneRequest;
import com.example.server.module.project.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneMapper milestoneMapper;
    private final ProjectService projectService;
    private final AuditService auditService;

    public List<Milestone> listByProject(UUID projectId) {
        projectService.requireVisibleProject(projectId);
        return milestoneMapper.findByProject(projectId);
    }

    public Milestone create(UUID projectId, CreateMilestoneRequest request) {
        projectService.requireVisibleProject(projectId);
        UUID milestoneId = UUID.randomUUID();
        milestoneMapper.insert(milestoneId, projectId, request.name(), request.dueDate(), request.status());
        auditService.record("CREATE_MILESTONE", "MILESTONE", milestoneId);
        return milestoneMapper.findById(milestoneId);
    }

    public Milestone update(UUID milestoneId, UpdateMilestoneRequest request) {
        Milestone milestone = requireMilestone(milestoneId);
        projectService.requireVisibleProject(milestone.projectId());
        milestoneMapper.update(milestoneId, request.name(), request.dueDate(), request.status());
        auditService.record("UPDATE_MILESTONE", "MILESTONE", milestoneId);
        return milestoneMapper.findById(milestoneId);
    }

    public void delete(UUID milestoneId) {
        Milestone milestone = requireMilestone(milestoneId);
        projectService.requireVisibleProject(milestone.projectId());
        milestoneMapper.delete(milestoneId);
        auditService.record("DELETE_MILESTONE", "MILESTONE", milestoneId);
    }

    private Milestone requireMilestone(UUID milestoneId) {
        Milestone milestone = milestoneMapper.findById(milestoneId);
        if (milestone == null) {
            throw NotFoundException.of("Milestone", milestoneId);
        }
        return milestone;
    }
}
