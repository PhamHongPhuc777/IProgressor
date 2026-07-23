package com.example.server.integration.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Seam for uploading task/project attachments to Google Drive.
 * LocalDocumentStorageClient is a local-filesystem dev stub ({@code dev} profile);
 * RealGoogleDriveStorageClient is the real Google Drive API implementation ({@code prod} profile).
 */
public interface DocumentStorageClient {

    StoredFile store(MultipartFile file, String context);

    /** Permanently removes the underlying file -- a no-op if it's already gone. */
    void delete(StoredFile storedFile);

    /**
     * The storage_type value this client handles (e.g. "LOCAL", "GOOGLE_DRIVE"). Only one
     * DocumentStorageClient bean is active per profile, but dev/prod share the same database --
     * AttachmentService checks this before calling delete() so a dev instance never tries to
     * delete a Google Drive URL as a local path (or vice versa) for a row created under a
     * different profile.
     */
    String storageType();
}
