-- Admin should be able to send workspace-wide broadcasts too, not just Leader (originally
-- Leader-only per ERD.md's permission matrix). The Admin row of the permission matrix is
-- immutable via the runtime API (see RoleService.updateRolePermissions), so this grant has to be
-- seeded here instead of through PUT /roles/{id}/permissions.

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM role r, permission p
WHERE r.name = 'Admin' AND p.key = 'broadcast_message.send'
ON CONFLICT DO NOTHING;
