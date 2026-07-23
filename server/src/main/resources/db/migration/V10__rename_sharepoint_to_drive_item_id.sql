-- File storage moved from Microsoft Graph API/SharePoint to Google Drive API (see PRD.md/SRS.md's
-- 2026-07-23 correction notes -- Entra ID had no free/self-serve tenant available). No real row
-- should have storage_type = 'SHAREPOINT' yet (that client was never exercised against a real
-- tenant), but the UPDATE below is a defensive no-op in case one ever existed.

ALTER TABLE attachment RENAME COLUMN sharepoint_item_id TO drive_item_id;

UPDATE attachment SET storage_type = 'GOOGLE_DRIVE' WHERE storage_type = 'SHAREPOINT';

ALTER TABLE attachment DROP CONSTRAINT attachment_storage_type_check;
ALTER TABLE attachment ADD CONSTRAINT attachment_storage_type_check CHECK (storage_type IN ('GOOGLE_DRIVE', 'LOCAL'));
