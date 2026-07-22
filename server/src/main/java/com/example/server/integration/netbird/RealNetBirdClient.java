package com.example.server.integration.netbird;

import com.example.server.module.workspace.department.Department;
import com.example.server.module.workspace.department.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Calls NetBird's REST API (NetBird Cloud by default -- see app.netbird.api-base-url). Matches
 * NetBird users by email since NetBird Cloud can't reach a local self-hosted Zitadel instance for
 * SSO/idp_id-based linkage. Department maps 1:1 to a NetBird group, created lazily and cached on
 * department.netbird_group_id, mirroring how ZitadelProvisioningClient handles zitadel_org_id.
 */
@Component
@RequiredArgsConstructor
public class RealNetBirdClient implements NetBirdClient {

    /**
     * One-time-bootstrapped NetBird ACL policy (see Markdown/ENDPOINT.md) whose source groups are
     * kept in sync here so a newly created department automatically gains network access to the
     * app server without anyone having to remember to update the policy by hand.
     */
    private static final String APP_ACCESS_POLICY_NAME = "Employees to App Server";

    private final DepartmentService departmentService;
    private final RestClient restClient = RestClient.create();

    @Value("${app.netbird.api-base-url}")
    private String baseUrl;

    @Value("${app.netbird.api-token}")
    private String apiToken;

    @Override
    public void addUserToGroup(String email, String fullName, UUID departmentId) {
        String groupId = ensureGroup(departmentId);
        Map<String, Object> existing = findUserByEmail(email);
        if (existing == null) {
            post("/api/users", Map.of(
                "email", email,
                "name", fullName,
                "role", "user",
                "auto_groups", List.of(groupId)
            ));
            return;
        }
        List<String> autoGroups = autoGroupsOf(existing);
        if (!autoGroups.contains(groupId)) {
            autoGroups.add(groupId);
            updateAutoGroups(existing, autoGroups);
        }
    }

    @Override
    public void removeUserFromGroup(String email, UUID departmentId) {
        Department department = departmentService.getById(departmentId);
        if (department.netbirdGroupId() == null) {
            return;
        }
        Map<String, Object> existing = findUserByEmail(email);
        if (existing == null) {
            return;
        }
        List<String> autoGroups = autoGroupsOf(existing);
        if (autoGroups.remove(department.netbirdGroupId())) {
            updateAutoGroups(existing, autoGroups);
        }
    }

    @Override
    public List<NetbirdConnectionStatus> pollConnectionStatuses() {
        Map<String, String> emailByNetbirdUserId = new HashMap<>();
        for (Map<String, Object> user : getList("/api/users")) {
            emailByNetbirdUserId.put((String) user.get("id"), (String) user.get("email"));
        }

        Map<String, boolean[]> connectedByEmail = new HashMap<>();
        Map<String, Instant> lastSeenByEmail = new HashMap<>();
        for (Map<String, Object> peer : getList("/api/peers")) {
            String email = emailByNetbirdUserId.get(peer.get("user_id"));
            if (email == null) {
                continue;
            }
            boolean connected = Boolean.TRUE.equals(peer.get("connected"));
            connectedByEmail.computeIfAbsent(email, e -> new boolean[1])[0] |= connected;
            Instant lastSeen = parseInstant(peer.get("last_seen"));
            if (lastSeen != null) {
                lastSeenByEmail.merge(email, lastSeen, (a, b) -> a.isAfter(b) ? a : b);
            }
        }

        List<NetbirdConnectionStatus> statuses = new ArrayList<>();
        for (String email : connectedByEmail.keySet()) {
            statuses.add(new NetbirdConnectionStatus(
                email, connectedByEmail.get(email)[0], lastSeenByEmail.get(email)));
        }
        return statuses;
    }

    private static Instant parseInstant(Object raw) {
        if (!(raw instanceof String s) || s.isBlank()) {
            return null;
        }
        return Instant.parse(s);
    }

    private String ensureGroup(UUID departmentId) {
        Department department = departmentService.getById(departmentId);
        if (department.netbirdGroupId() != null) {
            return department.netbirdGroupId();
        }
        List<Map<String, Object>> found = getList("/api/groups");
        String groupId = found.stream()
            .filter(g -> department.name().equals(g.get("name")))
            .map(g -> (String) g.get("id"))
            .findFirst()
            .orElseGet(() -> (String) post("/api/groups", Map.of("name", department.name())).get("id"));
        departmentService.updateNetbirdGroupId(departmentId, groupId);
        ensureGroupAllowedInAppPolicy(groupId);
        return groupId;
    }

    /** No-op if the policy hasn't been bootstrapped yet (e.g. local dev, before the one-time NetBird ACL setup). */
    @SuppressWarnings("unchecked")
    private void ensureGroupAllowedInAppPolicy(String groupId) {
        Map<String, Object> policy = getList("/api/policies").stream()
            .filter(p -> APP_ACCESS_POLICY_NAME.equals(p.get("name")))
            .findFirst()
            .orElse(null);
        if (policy == null) {
            return;
        }
        List<Map<String, Object>> rules = (List<Map<String, Object>>) policy.get("rules");
        Map<String, Object> rule = rules.get(0);
        List<String> sourceIds = groupIdsOf(rule.get("sources"));
        if (sourceIds.contains(groupId)) {
            return;
        }
        sourceIds.add(groupId);

        Map<String, Object> updatedRule = new HashMap<>(rule);
        updatedRule.put("sources", sourceIds);
        updatedRule.put("destinations", groupIdsOf(rule.get("destinations")));

        Map<String, Object> updatedPolicy = new HashMap<>(policy);
        updatedPolicy.put("rules", List.of(updatedRule));
        put("/api/policies/" + policy.get("id"), updatedPolicy);
    }

    @SuppressWarnings("unchecked")
    private static List<String> groupIdsOf(Object rawGroups) {
        List<String> ids = new ArrayList<>();
        for (Map<String, Object> g : (List<Map<String, Object>>) rawGroups) {
            ids.add((String) g.get("id"));
        }
        return ids;
    }

    private Map<String, Object> findUserByEmail(String email) {
        return getList("/api/users").stream()
            .filter(u -> email.equals(u.get("email")))
            .findFirst()
            .orElse(null);
    }

    /**
     * NetBird's PUT /api/users/{id} requires role, auto_groups, and is_blocked together in every
     * request -- omitting role (as an earlier version of this method did) gets rejected with
     * "invalid user role" rather than leaving it unchanged, so the existing user's values are
     * carried forward here instead of just sending the one field that's actually changing.
     */
    private void updateAutoGroups(Map<String, Object> existing, List<String> autoGroups) {
        put("/api/users/" + existing.get("id"), Map.of(
            "role", existing.get("role"),
            "auto_groups", autoGroups,
            "is_blocked", Boolean.TRUE.equals(existing.get("is_blocked"))
        ));
    }

    @SuppressWarnings("unchecked")
    private static List<String> autoGroupsOf(Map<String, Object> user) {
        Object raw = user.get("auto_groups");
        return raw == null ? new ArrayList<>() : new ArrayList<>((List<String>) raw);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(String path, Map<String, Object> body) {
        return restClient.post()
            .uri(baseUrl + path)
            .header("Authorization", "Token " + apiToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> put(String path, Map<String, Object> body) {
        return restClient.put()
            .uri(baseUrl + path)
            .header("Authorization", "Token " + apiToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getList(String path) {
        return restClient.get()
            .uri(baseUrl + path)
            .header("Authorization", "Token " + apiToken)
            .retrieve()
            .body(List.class);
    }
}
