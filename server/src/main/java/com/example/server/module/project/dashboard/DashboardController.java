package com.example.server.module.project.dashboard;

import com.example.server.common.ApiResponse;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.module.project.dashboard.dto.DashboardEnterpriseResponse;
import com.example.server.module.project.dashboard.dto.DashboardMeResponse;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('dashboard.view.own')")
    public ApiResponse<DashboardMeResponse> me() {
        return ApiResponse.ok(dashboardService.getMyDashboard());
    }

    // No single seeded permission covers "Leader or Admin" here (performance_risk.view is
    // Leader-only), so this is checked explicitly rather than declaratively.
    @GetMapping("/enterprise")
    public ApiResponse<DashboardEnterpriseResponse> enterprise() {
        AuthenticatedUser actor = CurrentUser.get();
        if (!actor.isAdmin() && !actor.hasPermission("performance_risk.view")) {
            throw new ForbiddenException("Leader/Admin only");
        }
        return ApiResponse.ok(dashboardService.getEnterpriseDashboard());
    }
}
