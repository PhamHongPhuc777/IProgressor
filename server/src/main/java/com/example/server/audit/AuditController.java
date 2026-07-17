package com.example.server.audit;

import com.example.server.common.ApiResponse;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('audit_log.view')")
    public ApiResponse<PageResponse<AuditLog>> search(
        @RequestParam(required = false) LocalDate date,
        @RequestParam(required = false) UUID actorId,
        @RequestParam(required = false) String entityType,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, null);
        return ApiResponse.ok(auditService.search(date, actorId, entityType, pageRequest));
    }

    @GetMapping("/days")
    @PreAuthorize("hasAuthority('audit_log.view')")
    public ApiResponse<List<LocalDate>> days() {
        return ApiResponse.ok(auditService.findDaysWithData());
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('audit_log.export')")
    public ResponseEntity<byte[]> export(@RequestParam LocalDate date, @RequestParam(defaultValue = "csv") String format) {
        if (!"csv".equalsIgnoreCase(format)) {
            throw new BadRequestException("Only CSV export is supported");
        }
        byte[] csv = auditService.exportCsv(date);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-log-" + date + ".csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv);
    }
}
