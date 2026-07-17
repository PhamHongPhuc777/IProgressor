package com.example.server.audit;

import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final String[] CSV_HEADER = {"audit_id", "actor_id", "action", "entity_type", "entity_id", "created_at"};

    private final AuditMapper auditMapper;

    /** Fire-and-forget audit trail write. AUDIT_LOG is append-only -- nothing here ever updates or deletes a row. */
    public void record(String action, String entityType, UUID entityId) {
        UUID actorId = CurrentUser.get().userId();
        auditMapper.insert(actorId, action, entityType, entityId);
    }

    public PageResponse<AuditLog> search(LocalDate date, UUID actorId, String entityType, PageRequest pageRequest) {
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        List<AuditLog> content = auditMapper.search(effectiveDate, actorId, entityType, pageRequest.size(), pageRequest.offset());
        long total = auditMapper.count(effectiveDate, actorId, entityType);
        return PageResponse.of(content, pageRequest, total);
    }

    public List<LocalDate> findDaysWithData() {
        return auditMapper.findDistinctDays();
    }

    public byte[] exportCsv(LocalDate date) {
        StringBuilder csv = new StringBuilder();
        csv.append(String.join(",", CSV_HEADER)).append('\n');
        for (AuditLog entry : auditMapper.findAllForDate(date)) {
            csv.append(csvRow(
                entry.auditId(), entry.actorId(), entry.action(),
                entry.entityType(), entry.entityId(), entry.createdAt()
            )).append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csvRow(Object... fields) {
        StringBuilder row = new StringBuilder();
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) {
                row.append(',');
            }
            row.append(escapeCsv(fields[i]));
        }
        return row.toString();
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String text = value.toString();
        if (text.contains(",") || text.contains("\"") || text.contains("\n")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }
}
