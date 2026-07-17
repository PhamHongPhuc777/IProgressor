package com.example.server.integration.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Seam for uploading task/project attachments to SharePoint via Microsoft Graph API. No Graph API
 * tenant credentials exist yet (see PRD/SRS), so only a local-filesystem dev stub implementation
 * exists today (LocalDocumentStorageClient). A real Graph API implementation belongs here later.
 */
public interface DocumentStorageClient {

    StoredFile store(MultipartFile file, String context);
}
