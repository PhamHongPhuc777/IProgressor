package com.example.server.security.dev;

import com.example.server.integration.zitadel.ZitadelProvisioningClient;
import com.example.server.module.workspace.department.Department;
import com.example.server.module.workspace.department.DepartmentMapper;
import com.example.server.module.workspace.role.Role;
import com.example.server.module.workspace.role.RoleService;
import com.example.server.module.workspace.user.User;
import com.example.server.module.workspace.user.UserService;
import com.example.server.module.workspace.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Dev-only: seeds real, interactively-loggable Zitadel identities for manual client testing --
 * every real (non-Administration) department gets one Staff/PM/Leader, plus one extra Admin. Unlike
 * the access-request approval flow, this sets a known password up front (see
 * {@link ZitadelProvisioningClient#provisionUserWithPassword}) so no invite email is needed and the
 * accounts are immediately loggable. Idempotent the same way approve() is -- safe to re-run.
 */
@Service
@RequiredArgsConstructor
public class DevSeedService {

    private static final List<String> DEPARTMENT_ROLES = List.of("Staff", "PM", "Leader");
    private static final String ADMIN_DEPARTMENT_NAME = "Administration";

    private final DepartmentMapper departmentMapper;
    private final RoleService roleService;
    private final ZitadelProvisioningClient zitadelProvisioningClient;
    private final UserService userService;

    public record SeededAccount(String fullName, String email, String role, String department) {
    }

    public List<SeededAccount> seedMembers(String password) {
        List<Department> departments = departmentMapper.findAll();
        List<SeededAccount> seeded = new ArrayList<>();

        for (Department department : departments) {
            if (ADMIN_DEPARTMENT_NAME.equals(department.name())) {
                continue;
            }
            for (String roleName : DEPARTMENT_ROLES) {
                seeded.add(seedOne(roleName, department, password));
            }
        }

        Department adminDepartment = departments.stream()
            .filter(d -> ADMIN_DEPARTMENT_NAME.equals(d.name()))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Administration department not found"));
        seeded.add(seedOne("Admin", adminDepartment, password, "test-admin-2"));

        return seeded;
    }

    private SeededAccount seedOne(String roleName, Department department, String password) {
        String slug = department.name().toLowerCase().replace(" ", "-");
        return seedOne(roleName, department, password, "test-" + roleName.toLowerCase() + "-" + slug);
    }

    private SeededAccount seedOne(String roleName, Department department, String password, String localPart) {
        String email = localPart + "@iprogressor.local";
        String fullName = roleName + " " + department.name();
        Role role = roleService.getByName(roleName);

        String zitadelUserId = zitadelProvisioningClient.provisionUserWithPassword(
            email, fullName, department.departmentId(), password);
        UserSummary existing = userService.findByEmail(email);
        User user = existing != null
            ? userService.getUser(existing.userId())
            : userService.provision(fullName, email, department.departmentId(), role.roleId(), zitadelUserId);

        return new SeededAccount(user.fullName(), user.email(), roleName, department.name());
    }
}
