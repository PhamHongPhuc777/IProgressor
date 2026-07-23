-- Lets AUDIT_LOG also carry synced Zitadel identity events (logins, password checks, profile
-- changes, ...) alongside this app's own business-action entries, per ZitadelEventSyncJob.

-- Some Zitadel events have no locally-resolvable actor (service accounts, SYSTEM/NOTIFICATION
-- editors, users outside this app's own org) -- actor_id must allow that.
ALTER TABLE audit_log ALTER COLUMN actor_id DROP NOT NULL;

-- Zitadel aggregate ids are plain numeric strings (e.g. "382694828967723010"), not UUIDs, so they
-- can't go in the existing entity_id UUID column -- entity_id stays NULL for these rows instead.
ALTER TABLE audit_log ADD COLUMN zitadel_aggregate_id VARCHAR(255);
ALTER TABLE audit_log ADD COLUMN zitadel_sequence BIGINT;

-- Zitadel's per-event "sequence" is scoped to its own aggregate instance, not globally monotonic
-- across the whole instance (confirmed against a live instance -- two aggregates independently had
-- sequence 1/2 at the same time) -- so (aggregate_id, sequence) together, not sequence alone, is
-- this event's stable identity. Used as the idempotency key so overlapping poll windows in
-- ZitadelEventSyncJob can't double-insert.
ALTER TABLE audit_log ADD CONSTRAINT uq_audit_log_zitadel_event UNIQUE (zitadel_aggregate_id, zitadel_sequence);
