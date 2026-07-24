package com.example.server.security.dev;

import com.example.server.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Dev-only convenience: see {@link DevSeedService}. Mounted under /api/v1/dev/**, already permitAll(). */
@RestController
@Profile("dev")
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
public class DevSeedController {

    private final DevSeedService devSeedService;

    @Value("${app.dev-seed.password:IProgressor#2026}")
    private String seedPassword;

    @PostMapping("/seed-members")
    public ApiResponse<List<DevSeedService.SeededAccount>> seedMembers() {
        return ApiResponse.ok(devSeedService.seedMembers(seedPassword));
    }
}
