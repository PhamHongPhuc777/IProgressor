package com.example.server.integration.storage;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Uploads task/project attachments to a single shared SharePoint document library via Microsoft
 * Graph API, using app-only auth (client-credentials grant against Entra ID -- no signed-in user
 * in this flow). Unlike Zitadel (org-per-department) and NetBird (group-per-department), nothing
 * in PRD/ERD/API.md describes a per-department SharePoint mapping, and attachment has no
 * department linkage of its own (only task_id/project_id) -- so this targets one configured site
 * and organizes files under a folder-per-context tree (e.g. "task/{taskId}") instead of
 * provisioning a site per department.
 */
@Component
@Profile("prod")
public class RealSharePointStorageClient implements DocumentStorageClient {

    private static final String GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

    private final RestClient restClient = RestClient.create();

    @Value("${app.graph.tenant-id}")
    private String tenantId;

    @Value("${app.graph.client-id}")
    private String clientId;

    @Value("${app.graph.client-secret}")
    private String clientSecret;

    @Value("${app.graph.site-hostname}")
    private String siteHostname;

    @Value("${app.graph.site-path}")
    private String sitePath;

    private volatile String accessToken;
    private volatile Instant accessTokenExpiresAt;

    private volatile String siteId;
    private volatile String rootItemId;

    @Override
    public StoredFile store(MultipartFile file, String context) {
        String folderId = ensureFolder(context);
        String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String filename = UUID.randomUUID() + "-" + original;
        Map<String, Object> driveItem = uploadContent(folderId, filename, file);
        return new StoredFile("SHAREPOINT", (String) driveItem.get("id"), (String) driveItem.get("webUrl"));
    }

    /**
     * Resolves the shared site once and caches it for the process lifetime -- it's derived purely
     * from static config (hostname + path), not mutable per-row domain state like
     * department.zitadel_org_id, so there's no DB column to cache it in (see
     * RealZitadelProvisioningClient.ensureOrg for that pattern).
     */
    private synchronized void ensureSite() {
        if (siteId != null) {
            return;
        }
        String relativePath = sitePath.startsWith("/") ? sitePath.substring(1) : sitePath;
        Map<String, Object> site = get("/sites/" + siteHostname + ":/" + relativePath);
        siteId = (String) site.get("id");
        Map<String, Object> root = get("/sites/" + siteId + "/drive/root");
        rootItemId = (String) root.get("id");
    }

    /**
     * Ensures every folder segment in `context` (e.g. "task/{taskId}") exists under the site's
     * document library, creating any missing segment starting from root. Each segment is looked up
     * by path first and only created if missing -- same "search by name, create if absent" idiom as
     * RealNetBirdClient.ensureGroup/RealZitadelProvisioningClient.ensureOrg, rather than relying on
     * the simple-upload endpoint's undocumented folder auto-creation behavior.
     */
    private String ensureFolder(String context) {
        ensureSite();
        String parentId = rootItemId;
        StringBuilder pathSoFar = new StringBuilder();
        for (String segment : context.split("/")) {
            pathSoFar.append(pathSoFar.isEmpty() ? "" : "/").append(segment);
            parentId = ensureFolderSegment(parentId, pathSoFar.toString(), segment);
        }
        return parentId;
    }

    private String ensureFolderSegment(String parentId, String pathSoFar, String segmentName) {
        Map<String, Object> existing = getOrNull("/sites/" + siteId + "/drive/root:/" + pathSoFar);
        if (existing != null) {
            return (String) existing.get("id");
        }
        try {
            Map<String, Object> created = post("/sites/" + siteId + "/drive/items/" + parentId + "/children", Map.of(
                "name", segmentName,
                "folder", Map.of(),
                "@microsoft.graph.conflictBehavior", "fail"
            ));
            return (String) created.get("id");
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                // Lost a create race against a concurrent upload -- the segment now exists, look it
                // up instead of failing (same recovery as ensureOrg/ensureGroup).
                Map<String, Object> existingAfterRace = get("/sites/" + siteId + "/drive/root:/" + pathSoFar);
                return (String) existingAfterRace.get("id");
            }
            throw e;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> uploadContent(String folderId, String filename, MultipartFile file) {
        try {
            byte[] content = file.getBytes();
            MediaType contentType = file.getContentType() != null
                ? MediaType.parseMediaType(file.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
            return restClient.put()
                .uri(GRAPH_BASE_URL + "/sites/" + siteId + "/drive/items/" + folderId + ":/" + filename + ":/content")
                .header("Authorization", "Bearer " + getAccessToken())
                .contentType(contentType)
                .body(content)
                .retrieve()
                .body(Map.class);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read attachment for SharePoint upload", e);
        }
    }

    /**
     * Client-credentials grant (app-only, no signed-in user) -- see
     * markdown/SETUP.md's "SharePoint / Microsoft Graph" section for how tenant-id/client-id/
     * client-secret are obtained. Cached until shortly before expiry rather than refetched per call.
     */
    @SuppressWarnings("unchecked")
    private synchronized String getAccessToken() {
        if (accessToken != null && Instant.now().isBefore(accessTokenExpiresAt.minusSeconds(60))) {
            return accessToken;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("scope", "https://graph.microsoft.com/.default");
        form.add("client_secret", clientSecret);
        form.add("grant_type", "client_credentials");

        Map<String, Object> response = restClient.post()
            .uri("https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(Map.class);

        accessToken = (String) response.get("access_token");
        accessTokenExpiresAt = Instant.now().plusSeconds(((Number) response.get("expires_in")).longValue());
        return accessToken;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> get(String path) {
        return restClient.get()
            .uri(GRAPH_BASE_URL + path)
            .header("Authorization", "Bearer " + getAccessToken())
            .retrieve()
            .body(Map.class);
    }

    private Map<String, Object> getOrNull(String path) {
        try {
            return get(path);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                return null;
            }
            throw e;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(String path, Map<String, Object> body) {
        return restClient.post()
            .uri(GRAPH_BASE_URL + path)
            .header("Authorization", "Bearer " + getAccessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);
    }
}
