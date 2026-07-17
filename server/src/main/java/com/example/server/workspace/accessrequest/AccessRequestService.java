package com.example.server.workspace.accessrequest;

import com.example.server.audit.AuditService;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.common.exception.ConflictException;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.integration.zitadel.ZitadelProvisioningClient;
import com.example.server.security.CurrentUser;
import com.example.server.workspace.accessrequest.dto.CreateAccessRequestRequest;
import com.example.server.workspace.role.Role;
import com.example.server.workspace.role.RoleService;
import com.example.server.workspace.user.User;
import com.example.server.workspace.user.UserService;
import com.example.server.workspace.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final AccessRequestMapper accessRequestMapper;
    private final UserService userService;
    private final RoleService roleService;
    private final AuditService auditService;
    private final ZitadelProvisioningClient zitadelProvisioningClient;

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
        return accessRequestMapper.findById(requestId);
    }

    public PageResponse<AccessRequest> list(UUID departmentId, String status, PageRequest pageRequest) {
        UUID ownDepartmentId = CurrentUser.get().departmentId();
        if (departmentId != null && !departmentId.equals(ownDepartmentId)) {
            throw new ForbiddenException("Cannot view access requests for another department");
        }
        List<AccessRequest> content = accessRequestMapper.findByDepartment(ownDepartmentId, status,
            pageRequest.size(), pageRequest.offset());
        long total = accessRequestMapper.countByDepartment(ownDepartmentId, status);
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
            String zitadelUserId = zitadelProvisioningClient.provisionUser(request.email(), request.fullName());
            Role staffRole = roleService.getByName("Staff");
            User newUser = userService.provision(request.fullName(), request.email(),
                request.departmentId(), staffRole.roleId(), zitadelUserId);
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
        if (!request.departmentId().equals(CurrentUser.get().departmentId())) {
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
