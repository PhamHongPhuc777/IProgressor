-- One-time, idempotent bootstrap: creates the first Admin so subsequent accounts can be
-- provisioned through the normal ACCESS_REQUEST approval flow (see ERD.md "Khởi tạo Admin đầu tiên").
-- Values come from Flyway placeholders (spring.flyway.placeholders.*), bound to env vars in
-- application.yml. ${adminZitadelUserId} must reference a Zitadel identity created manually,
-- outside the app, beforehand -- this migration never creates one.

INSERT INTO department (name)
VALUES ('${adminDepartmentName}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (full_name, email, department_id, role_id, zitadel_user_id, status)
SELECT '${adminFullName}', '${adminEmail}', d.department_id, r.role_id, '${adminZitadelUserId}', 'ACTIVE'
FROM department d, role r
WHERE d.name = '${adminDepartmentName}'
  AND r.name = 'Admin'
ON CONFLICT (zitadel_user_id) DO NOTHING;
