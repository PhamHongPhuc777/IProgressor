package com.example.server.module.workspace.role;

import com.example.server.audit.AuditService;
import com.example.server.common.exception.BadRequestException;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleMapper roleMapper;
    private final AuditService auditService;

    public List<Role> listRoles() {
        return roleMapper.findAll();
    }

    public Role getById(UUID roleId) {
        return requireRole(roleId);
    }

    public Role getByName(String name) {
        Role role = roleMapper.findByName(name);
        if (role == null) {
            throw NotFoundException.of("Role", name);
        }
        return role;
    }

    public List<Permission> listPermissions() {
        return roleMapper.findAllPermissions();
    }

    public List<Permission> getRolePermissions(UUID roleId) {
        requireRole(roleId);
        return roleMapper.findPermissionsForRole(roleId);
    }

    @Transactional
    public List<Permission> updateRolePermissions(UUID roleId, List<UUID> grant, List<UUID> revoke) {
        Role role = requireRole(roleId);
        if ("Admin".equals(role.name())) {
            throw new ForbiddenException("The Admin row of the permission matrix is immutable");
        }
        Set<UUID> overlap = new HashSet<>(grant);
        overlap.retainAll(revoke);
        if (!overlap.isEmpty()) {
            throw new BadRequestException("Cannot grant and revoke the same permission in one request: " + overlap);
        }

        int changed = 0;
        if (!grant.isEmpty()) {
            changed += roleMapper.grantPermissions(roleId, grant);
        }
        if (!revoke.isEmpty()) {
            changed += roleMapper.revokePermissions(roleId, revoke);
        }
        if (changed > 0) {
            auditService.record("UPDATE_ROLE_PERMISSIONS", "ROLE", roleId);
        }
        return roleMapper.findPermissionsForRole(roleId);
    }

    private Role requireRole(UUID roleId) {
        Role role = roleMapper.findById(roleId);
        if (role == null) {
            throw NotFoundException.of("Role", roleId);
        }
        return role;
    }
}
