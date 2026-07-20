package com.example.server.module.workspace.accessrequest;

import com.example.server.common.ApiResponse;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.module.workspace.accessrequest.dto.CreateAccessRequestRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/access-requests")
@RequiredArgsConstructor
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccessRequest>> submit(@Valid @RequestBody CreateAccessRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(accessRequestService.submit(request)));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('access_request.manage')")
    public ApiResponse<PageResponse<AccessRequest>> list(
        @RequestParam(required = false) UUID departmentId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.ok(accessRequestService.list(departmentId, status, PageRequest.of(page, size, null)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('access_request.manage')")
    public ApiResponse<AccessRequest> getById(@PathVariable("id") UUID id) {
        return ApiResponse.ok(accessRequestService.getById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('access_request.manage')")
    public ApiResponse<AccessRequest> approve(@PathVariable("id") UUID id) {
        return ApiResponse.ok(accessRequestService.approve(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('access_request.manage')")
    public ApiResponse<AccessRequest> reject(@PathVariable("id") UUID id) {
        return ApiResponse.ok(accessRequestService.reject(id));
    }
}
