package com.example.server.module.workspace.accessrequest;

import com.example.server.module.audit.AuditService;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.common.exception.ConflictException;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.integration.netbird.NetBirdClient;
import com.example.server.integration.zitadel.ZitadelProvisioningClient;
import com.example.server.module.message.notification.NotificationService;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.module.workspace.accessrequest.dto.CreateAccessRequestRequest;
import com.example.server.module.workspace.role.Role;
import com.example.server.module.workspace.role.RoleService;
import com.example.server.module.workspace.user.User;
import com.example.server.module.workspace.user.UserService;
import com.example.server.module.workspace.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final AccessRequestMapper accessRequestMapper;
    private final UserService userService;
    private final RoleService roleService;
    private final AuditService auditService;
    private final ZitadelProvisioningClient zitadelProvisioningClient;
    private final NetBirdClient netBirdClient;
    private final NotificationService notificationService;

    /**
     * Anonymous submission. If an account already exists for this email it's inferred to be an
     * UNLOCK_REQUEST (linked via existing_user_id); otherwise a NEW_ACCOUNT request is created --
     * matches ERD.md's two request_type flows without requiring the caller to specify one.
     */
    public AccessRequest submit(CreateAccessRequestRequest request) {
        UserSummary existing = userService.findByEmail(request.email());
        String requestType = "NEW_ACCOUNT";
        UUID existingUserId = null;
        if (existing != null) {
            if ("ACTIVE".equals(existing.status())) {
                throw new ConflictException("An active account already exists for this email");
            }
            requestType = "UNLOCK_REQUEST";
            existingUserId = existing.userId();
        }
        UUID requestId = UUID.randomUUID();
        accessRequestMapper.insert(requestId, requestType, request.fullName(), request.email(),
            request.departmentId(), existingUserId);
        notifyApprovers(requestId, request.departmentId());
        return accessRequestMapper.findById(requestId);
    }

    /**
     * Notifies whoever can actually approve this request: anyone with
     * access_request.manage.all_departments (company-wide, e.g. Admin), plus anyone with plain
     * access_request.manage scoped to this request's own department (e.g. a future department-
     * scoped Leader grant) -- mirrors the same permission check approve()/reject() enforce, so the
     * notified audience always matches who is actually allowed to act.
     */
    private void notifyApprovers(UUID requestId, UUID departmentId) {
        Set<UUID> recipientIds = new HashSet<>(userService.getUserIdsByPermission("access_request.manage.all_departments"));
        recipientIds.addAll(userService.getUserIdsByPermissionAndDepartment("access_request.manage", departmentId));
        for (UUID recipientId : recipientIds) {
            notificationService.notifyUser(recipientId, "ACCESS_REQUEST", requestId);
        }
    }

    public PageResponse<AccessRequest> list(UUID departmentId, String status, PageRequest pageRequest) {
        AuthenticatedUser actor = CurrentUser.get();
        if (!actor.hasPermission("access_request.manage.all_departments")
            && departmentId != null && !departmentId.equals(actor.departmentId())) {
            throw new ForbiddenException("Cannot view access requests for another department");
        }
        UUID effectiveDepartmentId = actor.hasPermission("access_request.manage.all_departments")
            ? departmentId : actor.departmentId();
        List<AccessRequest> content = accessRequestMapper.findByDepartment(effectiveDepartmentId, status,
            pageRequest.size(), pageRequest.offset());
        long total = accessRequestMapper.countByDepartment(effectiveDepartmentId, status);
        return PageResponse.of(content, pageRequest, total);
    }

    public AccessRequest getById(UUID id) {
        AccessRequest request = requireRequest(id);
        requireOwnDepartment(request);
        return request;
    }

    @Transactional
    public AccessRequest approve(UUID id) {
        AccessRequest request = requireRequest(id);
        requireOwnDepartment(request);
        requirePending(request);
        UUID reviewerId = CurrentUser.get().userId();

        if ("UNLOCK_REQUEST".equals(request.requestType())) {
            userService.unlock(request.existingUserId());
            accessRequestMapper.approveUnlock(id, reviewerId);
        } else {
            String zitadelUserId = zitadelProvisioningClient.provisionUser(
                request.email(), request.fullName(), request.departmentId());
            Role staffRole = roleService.getByName("Staff");
            User newUser = userService.provision(request.fullName(), request.email(),
                request.departmentId(), staffRole.roleId(), zitadelUserId);
            netBirdClient.addUserToGroup(request.email(), request.fullName(), request.departmentId());
            accessRequestMapper.approveNewAccount(id, reviewerId, newUser.userId());
        }
        auditService.record("APPROVE_ACCESS_REQUEST", "ACCESS_REQUEST", id);
        return accessRequestMapper.findById(id);
    }

    @Transactional
    public AccessRequest reject(UUID id) {
        AccessRequest request = requireRequest(id);
        requireOwnDepartment(request);
        requirePending(request);
        accessRequestMapper.reject(id, CurrentUser.get().userId());
        auditService.record("REJECT_ACCESS_REQUEST", "ACCESS_REQUEST", id);
        return accessRequestMapper.findById(id);
    }

    private void requireOwnDepartment(AccessRequest request) {
        AuthenticatedUser actor = CurrentUser.get();
        if (!actor.hasPermission("access_request.manage.all_departments")
            && !request.departmentId().equals(actor.departmentId())) {
            throw new ForbiddenException("Cannot manage access requests for another department");
        }
    }

    private void requirePending(AccessRequest request) {
        if (!"PENDING".equals(request.status())) {
            throw new ConflictException("This request has already been reviewed");
        }
    }

    private AccessRequest requireRequest(UUID id) {
        AccessRequest request = accessRequestMapper.findById(id);
        if (request == null) {
            throw NotFoundException.of("AccessRequest", id);
        }
        return request;
    }
}
