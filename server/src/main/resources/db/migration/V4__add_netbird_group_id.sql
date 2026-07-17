-- Caches the NetBird group id for each department, mirroring department.zitadel_org_id's shape.
-- Distinct from zitadel_org_id because it's a different system's id, even though conceptually
-- both are "1 per department".

ALTER TABLE department ADD COLUMN netbird_group_id VARCHAR(255) UNIQUE;
