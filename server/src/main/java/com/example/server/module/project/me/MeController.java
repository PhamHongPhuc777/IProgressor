package com.example.server.module.project.me;

import com.example.server.common.ApiResponse;
import com.example.server.module.project.me.dto.MeProfile;
import com.example.server.module.project.me.dto.MyStats;
import com.example.server.module.project.me.dto.UpdateAvatarRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping
    public ApiResponse<MeProfile> me() {
        return ApiResponse.ok(meService.getProfile());
    }

    @PatchMapping("/avatar")
    @PreAuthorize("hasAuthority('profile.avatar.update')")
    public ApiResponse<MeProfile> updateAvatar(@Valid @RequestBody UpdateAvatarRequest request) {
        return ApiResponse.ok(meService.updateAvatar(request.avatarUrl()));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('stats.view.own')")
    public ApiResponse<MyStats> stats() {
        return ApiResponse.ok(meService.getStats());
    }
}
