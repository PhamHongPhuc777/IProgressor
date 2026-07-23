package com.example.server.integration.zitadel;

import com.example.server.module.workspace.department.Department;
import com.example.server.module.workspace.department.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
        // Same "external side effect a later @Transactional failure can't undo" problem as
        // ensureOrg below: if a previous approve() created this Zitadel user but then failed on a
        // later step (e.g. NetBird), retrying would otherwise collide on Zitadel's unique
        // email/username constraint instead of reusing the identity that already exists.
        String existingUserId = findUserIdByEmail(email);
        return existingUserId != null ? existingUserId : createHumanUser(orgId, email, fullName);
    }

    @SuppressWarnings("unchecked")
    private String findUserIdByEmail(String email) {
        Map<String, Object> body = Map.of("queries", java.util.List.of(
            Map.of("emailQuery", Map.of("emailAddress", email))
        ));
        Map<String, Object> response = post("/v2/users", body);
        var results = (java.util.List<Map<String, Object>>) response.get("result");
        return (results == null || results.isEmpty()) ? null : (String) results.get(0).get("userId");
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

    /**
     * Both the password and email-verification fields are omitted entirely (not set to a
     * placeholder/false value) -- Zitadel's SetHumanEmail.verification is a oneof, so explicitly
     * setting isVerified=false still selects that oneof branch and suppresses the email; only
     * leaving the whole field unset triggers Zitadel's native "Initialize User" email, which lets
     * the applicant set their own password and verify their email in one link. Requires SMTP to
     * be configured on this Zitadel instance (see markdown/SETUP.md's "Email (SMTP for Zitadel)"),
     * otherwise the account exists but the invite never arrives.
     */
    private String createHumanUser(String orgId, String email, String fullName) {
        String[] nameParts = splitName(fullName);
        Map<String, Object> response = post("/v2/users/human", Map.of(
            "organization", Map.of("orgId", orgId),
            "profile", Map.of("givenName", nameParts[0], "familyName", nameParts[1]),
            "email", Map.of("email", email)
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
}
