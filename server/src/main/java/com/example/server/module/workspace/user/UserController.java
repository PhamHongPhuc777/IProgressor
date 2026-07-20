package com.example.server.module.workspace.user;

import com.example.server.common.ApiResponse;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.module.workspace.user.dto.ChangeRoleRequest;
import com.example.server.module.workspace.user.dto.LockUserRequest;
import com.example.server.module.workspace.user.dto.NetbirdStatus;
import com.example.server.module.workspace.user.dto.UserSummary;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('enterprise.members.view')")
    public ApiResponse<PageResponse<UserSummary>> list(
        @RequestParam(required = false) UUID departmentId,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.ok(userService.list(departmentId, PageRequest.of(page, size, null)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('workspace.members.view')")
    public ApiResponse<UserSummary> getById(@PathVariable("id") UUID id) {
        return ApiResponse.ok(userService.getById(id));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAuthority('user.role.change')")
    public ApiResponse<UserSummary> changeRole(@PathVariable("id") UUID id, @Valid @RequestBody ChangeRoleRequest request) {
        return ApiResponse.ok(userService.changeRole(id, request));
    }

    @PostMapping("/{id}/lock")
    @PreAuthorize("hasAuthority('user.lock_unlock')")
    public ApiResponse<UserSummary> lock(@PathVariable("id") UUID id, @Valid @RequestBody LockUserRequest request) {
        return ApiResponse.ok(userService.lock(id, request));
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasAuthority('user.lock_unlock')")
    public ApiResponse<UserSummary> unlock(@PathVariable("id") UUID id) {
        return ApiResponse.ok(userService.unlock(id));
    }

    @GetMapping("/{id}/netbird-status")
    @PreAuthorize("hasAuthority('user.netbird_status.view')")
    public ApiResponse<NetbirdStatus> netbirdStatus(@PathVariable("id") UUID id) {
        return ApiResponse.ok(userService.getNetbirdStatus(id));
    }
}
