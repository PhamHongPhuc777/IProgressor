package com.example.server.workspace.department;

import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.workspace.department.dto.DepartmentPerformance;
import com.example.server.workspace.department.dto.WorkloadEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentMapper departmentMapper;

    /** Staff/PM only ever see their own department; Leader/Admin see all (project.view.all_departments). */
    public List<Department> list() {
        AuthenticatedUser actor = CurrentUser.get();
        if (actor.hasPermission("project.view.all_departments")) {
            return departmentMapper.findAll();
        }
        Department own = departmentMapper.findById(actor.departmentId());
        return own == null ? List.of() : List.of(own);
    }

    public Department getById(UUID departmentId) {
        return requireDepartment(departmentId);
    }

    public List<WorkloadEntry> getResourceAllocation(UUID departmentId) {
        AuthenticatedUser actor = CurrentUser.get();
        if (!departmentId.equals(actor.departmentId())) {
            throw new ForbiddenException("PMs can only view workload for their own department");
        }
        requireDepartment(departmentId);
        return departmentMapper.findWorkload(departmentId);
    }

    public DepartmentPerformance getPerformanceRisk(UUID departmentId) {
        requireDepartment(departmentId);
        return departmentMapper.findPerformance(departmentId);
    }

    private Department requireDepartment(UUID departmentId) {
        Department department = departmentMapper.findById(departmentId);
        if (department == null) {
            throw NotFoundException.of("Department", departmentId);
        }
        return department;
    }
}
