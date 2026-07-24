-- Removes the orphaned department.settings.update permission. It was seeded in V2 and granted to
-- Admin, but no PATCH /departments/{id}/settings endpoint was ever built (DEPARTMENT has no
-- settings schema, so the feature stayed deferred -- see API.md's "Còn mở"). Left in place it shows
-- up in an Admin's GET /me permissions with nothing behind it, which would mislead the client into
-- rendering a dead settings control. Reintroduce it (and the endpoint + schema together) if/when
-- workspace settings are actually scoped.

DELETE FROM role_permission
WHERE permission_id = (SELECT permission_id FROM permission WHERE key = 'department.settings.update');

DELETE FROM permission WHERE key = 'department.settings.update';
