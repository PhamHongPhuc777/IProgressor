package com.example.server.integration.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Seam for uploading task/project attachments to SharePoint via Microsoft Graph API.
 * LocalDocumentStorageClient is a local-filesystem dev stub ({@code dev} profile);
 * RealSharePointStorageClient is the real Graph API implementation ({@code prod} profile).
 */
public interface DocumentStorageClient {

    StoredFile store(MultipartFile file, String context);
}
