package com.example.server.workspace.user;

import com.example.server.audit.AuditService;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.common.exception.BadRequestException;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.workspace.role.Role;
import com.example.server.workspace.role.RoleService;
import com.example.server.workspace.user.dto.ChangeRoleRequest;
import com.example.server.workspace.user.dto.LockUserRequest;
import com.example.server.workspace.user.dto.NetbirdStatus;
import com.example.server.workspace.user.dto.UserRoleInfo;
import com.example.server.workspace.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final RoleService roleService;
    private final AuditService auditService;

    public UserSummary getById(UUID userId) {
        AuthenticatedUser actor = CurrentUser.get();
        UserSummary target = requireUser(userId);
        if (!actor.hasPermission("enterprise.members.view") && !target.departmentId().equals(actor.departmentId())) {
            throw new ForbiddenException("Cannot view users outside your own department");
        }
        return target;
    }

    /** GET /users -- company-wide, gated to enterprise.members.view (Leader/Admin) at the controller. */
    public PageResponse<UserSummary> list(UUID departmentId, PageRequest pageRequest) {
        List<UserSummary> content = userMapper.findSummaries(departmentId, pageRequest.size(), pageRequest.offset());
        long total = userMapper.countSummaries(departmentId);
        return PageResponse.of(content, pageRequest, total);
    }

    /** GET /departments/{id}/members -- open to all roles, always scoped to the given department. */
    public PageResponse<UserSummary> listByDepartment(UUID departmentId, PageRequest pageRequest) {
        List<UserSummary> content = userMapper.findSummaries(departmentId, pageRequest.size(), pageRequest.offset());
        long total = userMapper.countSummaries(departmentId);
        return PageResponse.of(content, pageRequest, total);
    }

    public NetbirdStatus getNetbirdStatus(UUID userId) {
        requireUser(userId);
        return userMapper.findNetbirdStatus(userId);
    }

    public UserSummary changeRole(UUID userId, ChangeRoleRequest request) {
        if (!request.confirm()) {
            throw new BadRequestException("confirm must be true to change a user's role");
        }
        AuthenticatedUser actor = CurrentUser.get();
        UserRoleInfo target = requireRoleInfo(userId);
        Role newRole = roleService.getById(request.roleId());

        if ("Admin".equals(target.roleName())) {
            if (!target.userId().equals(actor.userId())) {
                throw new ForbiddenException("Cannot change another Admin's role");
            }
            if (userMapper.countActiveAdmins() <= 1) {
                throw new ForbiddenException("Cannot demote the last remaining Admin");
            }
        }

        userMapper.updateRole(userId, newRole.roleId());
        auditService.record("CHANGE_USER_ROLE", "USER", userId);
        return userMapper.findSummaryById(userId);
    }

    public UserSummary lock(UUID userId, LockUserRequest request) {
        requireUser(userId);
        userMapper.lock(userId, request.reason());
        auditService.record("LOCK_USER", "USER", userId);
        return userMapper.findSummaryById(userId);
    }

    public UserSummary unlock(UUID userId) {
        requireUser(userId);
        userMapper.unlock(userId);
        auditService.record("UNLOCK_USER", "USER", userId);
        return userMapper.findSummaryById(userId);
    }

    /** Full ERD-shaped read, for self-service use (see me/MeService) -- no cross-department visibility check. */
    public User getUser(UUID userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw NotFoundException.of("User", userId);
        }
        return user;
    }

    public User updateAvatar(UUID userId, String avatarUrl) {
        userMapper.updateAvatar(userId, avatarUrl);
        return getUser(userId);
    }

    /** Unchecked summary lookup for internal/system use (e.g. notification fan-out), not API-facing. */
    public UserSummary getSummary(UUID userId) {
        return requireUser(userId);
    }

    /** Nullable -- used by AccessRequestService to detect whether an account already exists for an email. */
    public UserSummary findByEmail(String email) {
        return userMapper.findSummaryByEmail(email);
    }

    public List<UUID> getUserIdsByDepartment(UUID departmentId) {
        return userMapper.findUserIdsByDepartment(departmentId);
    }

    /** Creates a new ACTIVE user for an already-provisioned Zitadel identity (access-request approval). */
    public User provision(String fullName, String email, UUID departmentId, UUID roleId, String zitadelUserId) {
        UUID userId = UUID.randomUUID();
        userMapper.insertProvisioned(userId, fullName, email, departmentId, roleId, zitadelUserId);
        return getUser(userId);
    }

    public void updateStatusByZitadelUserId(String zitadelUserId, String status) {
        userMapper.updateStatusByZitadelUserId(zitadelUserId, status);
    }

    public void updateNetbirdStatus(String zitadelUserId, boolean connected, Instant lastSeen) {
        userMapper.updateNetbirdStatusByZitadelUserId(zitadelUserId, connected, lastSeen);
    }

    private UserSummary requireUser(UUID userId) {
        UserSummary user = userMapper.findSummaryById(userId);
        if (user == null) {
            throw NotFoundException.of("User", userId);
        }
        return user;
    }

    private UserRoleInfo requireRoleInfo(UUID userId) {
        UserRoleInfo info = userMapper.findRoleInfo(userId);
        if (info == null) {
            throw NotFoundException.of("User", userId);
        }
        return info;
    }
}
