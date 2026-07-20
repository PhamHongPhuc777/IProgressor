package com.example.server.module.workspace.role;

import com.example.server.common.ApiResponse;
import com.example.server.module.workspace.role.dto.UpdateRolePermissionsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('authority_matrix.manage')")
    public ApiResponse<List<Role>> roles() {
        return ApiResponse.ok(roleService.listRoles());
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('authority_matrix.manage')")
    public ApiResponse<List<Permission>> permissions() {
        return ApiResponse.ok(roleService.listPermissions());
    }

    @GetMapping("/roles/{id}/permissions")
    @PreAuthorize("hasAuthority('authority_matrix.manage')")
    public ApiResponse<List<Permission>> rolePermissions(@PathVariable("id") UUID id) {
        return ApiResponse.ok(roleService.getRolePermissions(id));
    }

    @PutMapping("/roles/{id}/permissions")
    @PreAuthorize("hasAuthority('authority_matrix.manage')")
    public ApiResponse<List<Permission>> updateRolePermissions(
        @PathVariable("id") UUID id, @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {
        return ApiResponse.ok(roleService.updateRolePermissions(id, request.permissionIds()));
    }
}
