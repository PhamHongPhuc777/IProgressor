package com.example.server.workspace.department;

import com.example.server.common.ApiResponse;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.workspace.department.dto.DepartmentPerformance;
import com.example.server.workspace.department.dto.WorkloadEntry;
import com.example.server.workspace.user.UserService;
import com.example.server.workspace.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('workspace.members.view')")
    public ApiResponse<List<Department>> list() {
        return ApiResponse.ok(departmentService.list());
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("hasAuthority('workspace.members.view')")
    public ApiResponse<PageResponse<UserSummary>> members(
        @PathVariable("id") UUID id,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.ok(userService.listByDepartment(id, PageRequest.of(page, size, null)));
    }

    @GetMapping("/{id}/resource-allocation")
    @PreAuthorize("hasAuthority('resource_allocation.view')")
    public ApiResponse<List<WorkloadEntry>> resourceAllocation(@PathVariable("id") UUID id) {
        return ApiResponse.ok(departmentService.getResourceAllocation(id));
    }

    @GetMapping("/{id}/performance-risk")
    @PreAuthorize("hasAuthority('performance_risk.view')")
    public ApiResponse<DepartmentPerformance> performanceRisk(@PathVariable("id") UUID id) {
        return ApiResponse.ok(departmentService.getPerformanceRisk(id));
    }
}
