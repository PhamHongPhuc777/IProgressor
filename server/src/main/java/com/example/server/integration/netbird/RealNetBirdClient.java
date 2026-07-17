package com.example.server.integration.netbird;

import com.example.server.workspace.department.Department;
import com.example.server.workspace.department.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
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
            updateAutoGroups((String) existing.get("id"), autoGroups);
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
            updateAutoGroups((String) existing.get("id"), autoGroups);
        }
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
        return groupId;
    }

    private Map<String, Object> findUserByEmail(String email) {
        return getList("/api/users").stream()
            .filter(u -> email.equals(u.get("email")))
            .findFirst()
            .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private void updateAutoGroups(String userId, List<String> autoGroups) {
        restClient.put()
            .uri(baseUrl + "/api/users/" + userId)
            .header("Authorization", "Token " + apiToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("auto_groups", autoGroups))
            .retrieve()
            .body(Map.class);
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
    private List<Map<String, Object>> getList(String path) {
        return restClient.get()
            .uri(baseUrl + path)
            .header("Authorization", "Token " + apiToken)
            .retrieve()
            .body(List.class);
    }
}
