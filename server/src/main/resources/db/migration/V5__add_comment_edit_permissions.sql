-- Comments were originally create+read only (see ERD.md's permission matrix, which only ever
-- defined task.comment.create). Adding author-only edit/delete so users can fix typos or remove
-- an unwanted comment -- enforcement of "own comment only" happens in CommentService, not here;
-- these permissions just gate who can call the endpoint at all (same broad grant as
-- task.comment.create: everyone with a real role).

INSERT INTO permission (key, description) VALUES
    ('task.comment.update', 'Edit own comment on a task'),
    ('task.comment.delete', 'Delete own comment on a task');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM (VALUES
    ('task.comment.update', 'Admin'), ('task.comment.update', 'Leader'), ('task.comment.update', 'PM'), ('task.comment.update', 'Staff'),
    ('task.comment.delete', 'Admin'), ('task.comment.delete', 'Leader'), ('task.comment.delete', 'PM'), ('task.comment.delete', 'Staff')
) AS seed(permission_key, role_name)
JOIN role r ON r.name = seed.role_name
JOIN permission p ON p.key = seed.permission_key;
