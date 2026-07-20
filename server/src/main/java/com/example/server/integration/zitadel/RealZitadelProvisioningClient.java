package com.example.server.integration.zitadel;

import com.example.server.module.workspace.department.Department;
import com.example.server.module.workspace.department.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * Calls Zitadel's v2 Management API (REST) to provision a real identity. Department maps 1:1 to a
 * Zitadel Organization (see PRD FR-1); the org is created lazily on first provision for a
 * department and its id cached on department.zitadel_org_id so later provisions reuse it.
 */
@Component
@RequiredArgsConstructor
public class RealZitadelProvisioningClient implements ZitadelProvisioningClient {

    private final DepartmentService departmentService;
    private final RestClient restClient = RestClient.create();

    @Value("${app.zitadel.management-api-base-url}")
    private String baseUrl;

    @Value("${app.zitadel.service-account-token}")
    private String serviceAccountToken;

    @Override
    public String provisionUser(String email, String fullName, UUID departmentId) {
        String orgId = ensureOrg(departmentId);
        return createHumanUser(orgId, email, fullName);
    }

    private String ensureOrg(UUID departmentId) {
        Department department = departmentService.getById(departmentId);
        if (department.zitadelOrgId() != null) {
            return department.zitadelOrgId();
        }
        // Org creation is a real external side effect that a later failure in the same
        // @Transactional method can't undo -- if a previous attempt created the org but then
        // failed before caching zitadel_org_id, a name-based lookup recovers it instead of
        // colliding on Zitadel's unique org-name constraint (see RealNetBirdClient.ensureGroup
        // for the same pattern).
        String orgId = findOrgIdByName(department.name());
        if (orgId == null) {
            Map<String, Object> response = post("/v2/organizations", Map.of("name", department.name()));
            orgId = (String) response.get("organizationId");
        }
        departmentService.updateZitadelOrgId(departmentId, orgId);
        return orgId;
    }

    @SuppressWarnings("unchecked")
    private String findOrgIdByName(String name) {
        Map<String, Object> body = Map.of("queries", java.util.List.of(
            Map.of("nameQuery", Map.of("name", name, "method", "TEXT_QUERY_METHOD_EQUALS"))
        ));
        Map<String, Object> response = post("/v2/organizations/_search", body);
        var results = (java.util.List<Map<String, Object>>) response.get("result");
        return (results == null || results.isEmpty()) ? null : (String) results.get(0).get("id");
    }

    private String createHumanUser(String orgId, String email, String fullName) {
        String[] nameParts = splitName(fullName);
        Map<String, Object> response = post("/v2/users/human", Map.of(
            "organization", Map.of("orgId", orgId),
            "profile", Map.of("givenName", nameParts[0], "familyName", nameParts[1]),
            "email", Map.of("email", email, "isVerified", false),
            // Zitadel requires an initial password; the user resets it via Zitadel's own
            // invite/forgot-password flow on first login rather than us handing one out.
            "password", Map.of("password", generateInitialPassword())
        ));
        return (String) response.get("userId");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(String path, Map<String, Object> body) {
        return restClient.post()
            .uri(baseUrl + path)
            .header("Authorization", "Bearer " + serviceAccountToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);
    }

    private static String[] splitName(String fullName) {
        int spaceIndex = fullName.indexOf(' ');
        return spaceIndex < 0
            ? new String[]{fullName, fullName}
            : new String[]{fullName.substring(0, spaceIndex), fullName.substring(spaceIndex + 1)};
    }

    /** Satisfies Zitadel's default password policy (upper/lower/digit/symbol); never shown to the user. */
    private static String generateInitialPassword() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes) + "!Aa1";
    }
}
