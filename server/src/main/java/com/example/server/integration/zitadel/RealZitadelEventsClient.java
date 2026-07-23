package com.example.server.integration.zitadel;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Calls Zitadel's Admin API event log (POST /admin/v1/events/_search) to pull identity events
 * (logins, password checks, profile changes, ...) for ZitadelEventSyncJob. Verified directly
 * against a live local Zitadel instance, not guessed from docs -- see the plan this shipped with.
 * Filters to aggregateTypes covering both the classic OIDC code-exchange flow (auth_request,
 * oidc_session -- what this dev instance's own token flow actually produces) and Zitadel's newer
 * unified Login V2 flow (session), plus the user aggregate itself (password checks, profile
 * changes, email verification).
 *
 * <p>This endpoint's {@code from} request field turned out to be a no-op on this Zitadel version
 * (confirmed live: an {@code asc:true} query with {@code from} set still always returned the
 * *oldest* matching events from the beginning of history, never anything newer, so it can't be
 * used as an incremental cursor). Instead this fetches the newest {@code limit} events
 * ({@code asc:false}, no {@code from}) every call: {@code since} is applied client-side by
 * {@link com.example.server.module.audit.ZitadelEventSyncJob}, not sent to Zitadel at all. This
 * misses events if more than {@code limit} relevant ones land in a single poll interval, but that's
 * not a realistic volume for this app's usage.
 *
 * <p>For {@code session}/{@code oidc_session}/{@code auth_request} events -- the actual "who logged
 * in" ones -- {@code editor.userId} is Zitadel's own pseudo-actor ({@code SYSTEM}/{@code
 * NOTIFICATION}) or absent entirely, not the person who logged in; that person's id is instead in
 * {@code payload.userID} (confirmed live: an {@code oidc_session.added} event's payload carried
 * {@code "userID": "382694828967723010"} while its editor was {@code "SYSTEM"}). So the actor id
 * falls back to {@code payload.userID} whenever {@code editor.userId} isn't a real user.
 */
@Component
public class RealZitadelEventsClient implements ZitadelEventsClient {

    private static final List<String> AGGREGATE_TYPES = List.of("user", "session", "auth_request", "oidc_session");
    private static final List<String> NON_USER_EDITORS = List.of("SYSTEM", "NOTIFICATION");

    private final RestClient restClient = RestClient.create();

    @Value("${app.zitadel.management-api-base-url}")
    private String baseUrl;

    @Value("${app.zitadel.service-account-token}")
    private String serviceAccountToken;

    @Override
    @SuppressWarnings("unchecked")
    public List<ZitadelIdentityEvent> fetchIdentityEvents(Instant since) {
        Map<String, Object> body = Map.of(
            "query", Map.of("limit", 100, "asc", false),
            "aggregateTypes", AGGREGATE_TYPES
        );
        Map<String, Object> response = restClient.post()
            .uri(baseUrl + "/admin/v1/events/_search")
            .header("Authorization", "Bearer " + serviceAccountToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);

        List<Map<String, Object>> events = (List<Map<String, Object>>) response.get("events");
        List<ZitadelIdentityEvent> result = new ArrayList<>();
        if (events == null) {
            return result;
        }
        for (Map<String, Object> event : events) {
            Map<String, Object> editor = (Map<String, Object>) event.get("editor");
            Map<String, Object> aggregate = (Map<String, Object>) event.get("aggregate");
            Map<String, Object> type = (Map<String, Object>) event.get("type");
            Map<String, Object> payload = (Map<String, Object>) event.get("payload");
            Instant creationDate = Instant.parse((String) event.get("creationDate"));
            if (!creationDate.isAfter(since)) {
                continue;
            }
            result.add(new ZitadelIdentityEvent(
                resolveEditorUserId(editor, payload),
                (String) aggregate.get("id"),
                Long.parseLong((String) event.get("sequence")),
                creationDate,
                (String) type.get("type")
            ));
        }
        Collections.reverse(result); // response is newest-first; return ascending per this method's contract
        return result;
    }

    private static String resolveEditorUserId(Map<String, Object> editor, Map<String, Object> payload) {
        String editorUserId = (String) editor.get("userId");
        if (editorUserId != null && !NON_USER_EDITORS.contains(editorUserId)) {
            return editorUserId;
        }
        return payload == null ? null : (String) payload.get("userID");
    }
}
