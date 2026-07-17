-- Seeds the 4 fixed roles, the PERMISSION catalog, and the default ROLE_PERMISSION matrix,
-- exactly per the "Danh sách seed cho PERMISSION" table in Markdown/ERD.md. The matrix is
-- runtime-editable afterwards via PUT /roles/{id}/permissions (Admin row stays locked in code).

INSERT INTO role (name) VALUES ('Admin'), ('Leader'), ('PM'), ('Staff');

INSERT INTO permission (key, description) VALUES
    ('dashboard.view.own', 'View own dashboard'),
    ('project.view', 'View project overview'),
    ('project.view.multiview', 'View Kanban/List/Gantt/Calendar'),
    ('project.view.all_departments', 'View and filter projects across all departments'),
    ('project.crud', 'Create/edit/archive projects'),
    ('milestone.crud', 'Create/edit/delete milestones'),
    ('task.crud', 'Create/edit/delete tasks'),
    ('task.subtask.crud', 'Full subtask CRUD (not just status toggle)'),
    ('task.status.update', 'Update status of an assigned task/subtask'),
    ('task.priority.update', 'Update task priority'),
    ('task.assignee.update', 'Reassign task'),
    ('task.deadline.update', 'Update task deadline'),
    ('task.description.update', 'Update task description'),
    ('task.comment.create', 'Comment on any task'),
    ('task.attachment.upload', 'Upload SharePoint attachment (rate-limited)'),
    ('workspace.members.view', 'View own workspace members'),
    ('enterprise.members.view', 'View members across all workspaces'),
    ('stats.view.own', 'View own personal stats'),
    ('resource_allocation.view', 'View workload/resource allocation'),
    ('performance_risk.view', 'View cross-department performance & risk'),
    ('notification.receive_realtime', 'Receive real-time notification stream'),
    ('broadcast_message.send', 'Send workspace-wide broadcast'),
    ('profile.avatar.update', 'Update own avatar'),
    ('access_request.manage', 'Approve/reject access & unlock requests'),
    ('user.lock_unlock', 'Lock/unlock user accounts'),
    ('user.role.change', 'Promote/demote user role'),
    ('user.netbird_status.view', 'View per-user NetBird connection status'),
    ('department.settings.update', 'Update workspace settings'),
    ('authority_matrix.manage', 'Edit ROLE_PERMISSION (except the Admin row)'),
    ('audit_log.view', 'View audit log'),
    ('audit_log.export', 'Export audit log to CSV');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM (VALUES
    ('dashboard.view.own', 'Admin'), ('dashboard.view.own', 'Leader'), ('dashboard.view.own', 'PM'), ('dashboard.view.own', 'Staff'),
    ('project.view', 'Admin'), ('project.view', 'Leader'), ('project.view', 'PM'), ('project.view', 'Staff'),
    ('project.view.multiview', 'Admin'), ('project.view.multiview', 'Leader'), ('project.view.multiview', 'PM'), ('project.view.multiview', 'Staff'),
    ('project.view.all_departments', 'Admin'), ('project.view.all_departments', 'Leader'),
    ('project.crud', 'Admin'), ('project.crud', 'PM'),
    ('milestone.crud', 'Admin'), ('milestone.crud', 'PM'),
    ('task.crud', 'Admin'), ('task.crud', 'PM'),
    ('task.subtask.crud', 'Admin'), ('task.subtask.crud', 'PM'),
    ('task.status.update', 'Admin'), ('task.status.update', 'PM'), ('task.status.update', 'Staff'),
    ('task.priority.update', 'Admin'), ('task.priority.update', 'PM'),
    ('task.assignee.update', 'Admin'), ('task.assignee.update', 'PM'),
    ('task.deadline.update', 'Admin'), ('task.deadline.update', 'PM'),
    ('task.description.update', 'Admin'), ('task.description.update', 'PM'),
    ('task.comment.create', 'Admin'), ('task.comment.create', 'Leader'), ('task.comment.create', 'PM'), ('task.comment.create', 'Staff'),
    ('task.attachment.upload', 'Admin'), ('task.attachment.upload', 'Leader'), ('task.attachment.upload', 'PM'), ('task.attachment.upload', 'Staff'),
    ('workspace.members.view', 'Admin'), ('workspace.members.view', 'Leader'), ('workspace.members.view', 'PM'), ('workspace.members.view', 'Staff'),
    ('enterprise.members.view', 'Admin'), ('enterprise.members.view', 'Leader'),
    ('stats.view.own', 'Staff'),
    ('resource_allocation.view', 'PM'),
    ('performance_risk.view', 'Leader'),
    ('notification.receive_realtime', 'Admin'), ('notification.receive_realtime', 'Leader'), ('notification.receive_realtime', 'PM'), ('notification.receive_realtime', 'Staff'),
    ('broadcast_message.send', 'Leader'),
    ('profile.avatar.update', 'Admin'), ('profile.avatar.update', 'Leader'), ('profile.avatar.update', 'PM'), ('profile.avatar.update', 'Staff'),
    ('access_request.manage', 'Admin'),
    ('user.lock_unlock', 'Admin'),
    ('user.role.change', 'Admin'),
    ('user.netbird_status.view', 'Admin'),
    ('department.settings.update', 'Admin'),
    ('authority_matrix.manage', 'Admin'),
    ('audit_log.view', 'Admin'),
    ('audit_log.export', 'Admin')
) AS seed(permission_key, role_name)
JOIN role r ON r.name = seed.role_name
JOIN permission p ON p.key = seed.permission_key;
