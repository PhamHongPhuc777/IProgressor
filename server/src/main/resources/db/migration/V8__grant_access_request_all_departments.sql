-- access_request.manage is Admin-only (see V2), and AccessRequestService department-scoped it the
-- same as a department Leader would be. But Admin's own department ("Administration", a
-- dev/bootstrap-only department seeded in V3, not public-facing) is never the target department of
-- a real access request, so no access request for any real department (IT/Marketing/HR/Accounting)
-- could ever actually be approved. Mirrors the existing project.view.all_departments pattern
-- (ProjectService/DepartmentService/DashboardService) rather than special-casing the Admin role
-- name directly in AccessRequestService.

INSERT INTO permission (key, description) VALUES
    ('access_request.manage.all_departments', 'Approve/reject access & unlock requests for any department, not just your own')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM role r, permission p
WHERE r.name = 'Admin' AND p.key = 'access_request.manage.all_departments'
ON CONFLICT DO NOTHING;
