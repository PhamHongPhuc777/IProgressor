package com.example.server.integration.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Uploads task/project attachments to a Google Drive folder via Drive API v3, authenticating as a
 * real Google account via an OAuth2 refresh token -- not a service account.
 *
 * <p>A service-account JWT-bearer grant was tried first, but Google rejects it outright: service
 * accounts have no Drive storage quota of their own, so file creation 403s with
 * {@code storageQuotaExceeded} even when the account has been given Editor access to a folder (a
 * real error hit live, not a guess -- see the plan this shipped with). The two ways around that are
 * Shared Drives (Workspace-only, reintroducing the same organizational-tenant requirement this
 * project moved away from) or real user OAuth delegation -- this is that path: a one-time manual
 * consent (see markdown/SETUP.md's "Google Drive" section) yields a refresh token, which this client
 * exchanges for access tokens going forward with no further user interaction. Files this creates are
 * owned by that real account's own quota, so the target folder is just a folder that account already
 * owns -- no separate "share this folder with a service account" step needed.
 *
 * <p>Same folder-per-context design as the earlier SharePoint client (e.g. "task/{taskId}"), just
 * against Drive's parentId/`q`-search API instead of Graph's path-based addressing -- Drive has no
 * path-string addressing, only id/parent relationships.
 */
@Component
@Profile("prod")
public class RealGoogleDriveStorageClient implements DocumentStorageClient {

    private static final String DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3";
    private static final String DRIVE_UPLOAD_BASE_URL = "https://www.googleapis.com/upload/drive/v3";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

    private final RestClient restClient = RestClient.create();

    @Value("${app.google-drive.client-id}")
    private String clientId;

    @Value("${app.google-drive.client-secret}")
    private String clientSecret;

    @Value("${app.google-drive.refresh-token}")
    private String refreshToken;

    @Value("${app.google-drive.root-folder-id}")
    private String rootFolderId;

    private volatile String accessToken;
    private volatile Instant accessTokenExpiresAt;

    @Override
    public StoredFile store(MultipartFile file, String context) {
        String folderId = ensureFolder(context);
        String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String filename = UUID.randomUUID() + "-" + original;
        String fileId = createFileMetadata(folderId, filename);
        Map<String, Object> uploaded = uploadContent(fileId, file);
        return new StoredFile("GOOGLE_DRIVE", (String) uploaded.get("id"), (String) uploaded.get("webViewLink"));
    }

    /** Permanent delete (bypasses trash) -- a 404 means it's already gone, treated as a no-op rather than an error. */
    @Override
    public void delete(StoredFile storedFile) {
        try {
            restClient.delete()
                .uri(DRIVE_BASE_URL + "/files/" + storedFile.driveItemId())
                .header("Authorization", "Bearer " + getAccessToken())
                .retrieve()
                .toBodilessEntity();
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() != HttpStatus.NOT_FOUND) {
                throw e;
            }
        }
    }

    @Override
    public String storageType() {
        return "GOOGLE_DRIVE";
    }

    /**
     * Ensures every folder segment in `context` (e.g. "task/{taskId}") exists under the shared root
     * folder, creating any missing segment. Each segment is looked up by name first and only
     * created if missing -- same "search by name, create if absent" idiom as
     * RealNetBirdClient.ensureGroup/RealZitadelProvisioningClient.ensureOrg.
     */
    private String ensureFolder(String context) {
        String parentId = rootFolderId;
        for (String segment : context.split("/")) {
            parentId = ensureFolderSegment(parentId, segment);
        }
        return parentId;
    }

    @SuppressWarnings("unchecked")
    private String ensureFolderSegment(String parentId, String segmentName) {
        String escapedName = segmentName.replace("'", "\\'");
        String query = "name='" + escapedName + "' and '" + parentId + "' in parents and mimeType='"
            + FOLDER_MIME_TYPE + "' and trashed=false";
        URI uri = UriComponentsBuilder.fromUriString(DRIVE_BASE_URL + "/files")
            .queryParam("q", query)
            .queryParam("fields", "files(id)")
            .encode()
            .build()
            .toUri();
        Map<String, Object> searchResponse = restClient.get()
            .uri(uri)
            .header("Authorization", "Bearer " + getAccessToken())
            .retrieve()
            .body(Map.class);
        List<Map<String, Object>> found = (List<Map<String, Object>>) searchResponse.get("files");
        if (found != null && !found.isEmpty()) {
            return (String) found.get(0).get("id");
        }
        Map<String, Object> created = post(DRIVE_BASE_URL + "/files?fields=id", Map.of(
            "name", segmentName,
            "mimeType", FOLDER_MIME_TYPE,
            "parents", List.of(parentId)
        ));
        return (String) created.get("id");
    }

    @SuppressWarnings("unchecked")
    private String createFileMetadata(String folderId, String filename) {
        Map<String, Object> created = post(DRIVE_BASE_URL + "/files?fields=id", Map.of(
            "name", filename,
            "parents", List.of(folderId)
        ));
        return (String) created.get("id");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> uploadContent(String fileId, MultipartFile file) {
        try {
            byte[] content = file.getBytes();
            MediaType contentType = file.getContentType() != null
                ? MediaType.parseMediaType(file.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
            return restClient.patch()
                .uri(DRIVE_UPLOAD_BASE_URL + "/files/" + fileId + "?uploadType=media&fields=id,webViewLink")
                .header("Authorization", "Bearer " + getAccessToken())
                .contentType(contentType)
                .body(content)
                .retrieve()
                .body(Map.class);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read attachment for Google Drive upload", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(String url, Map<String, Object> body) {
        return restClient.post()
            .uri(url)
            .header("Authorization", "Bearer " + getAccessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map.class);
    }

    /**
     * Standard OAuth2 refresh-token grant -- see markdown/SETUP.md's "Google Drive" section for how
     * client-id/client-secret/refresh-token are obtained (one-time manual consent). Cached until
     * shortly before expiry rather than refetched per call.
     */
    @SuppressWarnings("unchecked")
    private synchronized String getAccessToken() {
        if (accessToken != null && Instant.now().isBefore(accessTokenExpiresAt.minusSeconds(60))) {
            return accessToken;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("refresh_token", refreshToken);
        form.add("grant_type", "refresh_token");

        Map<String, Object> response = restClient.post()
            .uri(TOKEN_URL)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(Map.class);

        accessToken = (String) response.get("access_token");
        accessTokenExpiresAt = Instant.now().plusSeconds(((Number) response.get("expires_in")).longValue());
        return accessToken;
    }
}
