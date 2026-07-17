-- Schema for IProgressor, per Markdown/ERD.md. Entity/field names are kept as in the ERD except
-- USER -> `users` (USER is a reserved word in PostgreSQL).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE department (
    department_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    zitadel_org_id  VARCHAR(255) UNIQUE
);

CREATE TABLE role (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE permission (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key           VARCHAR(100) NOT NULL UNIQUE,
    description   VARCHAR(255) NOT NULL
);

CREATE TABLE role_permission (
    role_id       UUID NOT NULL REFERENCES role (role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission (permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    user_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name          VARCHAR(255) NOT NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    department_id      UUID NOT NULL REFERENCES department (department_id),
    role_id            UUID NOT NULL REFERENCES role (role_id),
    zitadel_user_id    VARCHAR(255) NOT NULL UNIQUE,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED')),
    locked_reason      VARCHAR(255),
    avatar_url         VARCHAR(1024),
    netbird_connected  BOOLEAN NOT NULL DEFAULT FALSE,
    netbird_last_seen  TIMESTAMPTZ
);

CREATE INDEX idx_users_department_id ON users (department_id);
CREATE INDEX idx_users_role_id ON users (role_id);

CREATE TABLE access_request (
    request_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type       VARCHAR(20) NOT NULL DEFAULT 'NEW_ACCOUNT' CHECK (request_type IN ('NEW_ACCOUNT', 'UNLOCK_REQUEST')),
    full_name          VARCHAR(255) NOT NULL,
    email              VARCHAR(255) NOT NULL,
    department_id      UUID NOT NULL REFERENCES department (department_id),
    existing_user_id   UUID REFERENCES users (user_id),
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by        UUID REFERENCES users (user_id),
    reviewed_at        TIMESTAMPTZ,
    created_user_id    UUID REFERENCES users (user_id)
);

CREATE INDEX idx_access_request_department_id ON access_request (department_id);
CREATE INDEX idx_access_request_status ON access_request (status);

CREATE TABLE project (
    project_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(255) NOT NULL,
    department_id  UUID NOT NULL REFERENCES department (department_id),
    owner_id       UUID NOT NULL REFERENCES users (user_id),
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                       CHECK (status IN ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED')),
    start_date     DATE,
    end_date       DATE
);

CREATE INDEX idx_project_department_id ON project (department_id);
CREATE INDEX idx_project_owner_id ON project (owner_id);
CREATE INDEX idx_project_status ON project (status);

CREATE TABLE project_member (
    project_id    UUID NOT NULL REFERENCES project (project_id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    project_role  VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE milestone (
    milestone_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES project (project_id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    due_date      DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
                      CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'))
);

CREATE INDEX idx_milestone_project_id ON milestone (project_id);

CREATE TABLE task (
    task_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL REFERENCES project (project_id) ON DELETE CASCADE,
    milestone_id     UUID REFERENCES milestone (milestone_id) ON DELETE SET NULL,
    parent_task_id   UUID REFERENCES task (task_id) ON DELETE CASCADE,
    assignee_id      UUID REFERENCES users (user_id),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    start_date       DATE,
    due_date         DATE,
    status           VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
                         CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'DELAYED')),
    priority         VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
                         CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

CREATE INDEX idx_task_project_id ON task (project_id);
CREATE INDEX idx_task_milestone_id ON task (milestone_id);
CREATE INDEX idx_task_parent_task_id ON task (parent_task_id);
CREATE INDEX idx_task_assignee_id ON task (assignee_id);
CREATE INDEX idx_task_status ON task (status);

CREATE TABLE comment (
    comment_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES task (task_id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users (user_id),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comment_task_id ON comment (task_id);

-- uploaded_by/created_at aren't in ERD.md's ATTACHMENT field list but are required to enforce
-- API.md's "Staff can only delete their own uploads" rule on DELETE /attachments/{id}.
CREATE TABLE attachment (
    attachment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id             UUID REFERENCES task (task_id) ON DELETE CASCADE,
    project_id          UUID REFERENCES project (project_id) ON DELETE CASCADE,
    storage_type        VARCHAR(20) NOT NULL CHECK (storage_type IN ('SHAREPOINT', 'LOCAL')),
    sharepoint_item_id  VARCHAR(255),
    url                 VARCHAR(1024) NOT NULL,
    uploaded_by         UUID NOT NULL REFERENCES users (user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_attachment_owner CHECK (task_id IS NOT NULL OR project_id IS NOT NULL)
);

CREATE INDEX idx_attachment_task_id ON attachment (task_id);
CREATE INDEX idx_attachment_project_id ON attachment (project_id);

CREATE TABLE tag (
    tag_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE task_tag (
    task_id  UUID NOT NULL REFERENCES task (task_id) ON DELETE CASCADE,
    tag_id   UUID NOT NULL REFERENCES tag (tag_id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE notification (
    notification_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    entity_type      VARCHAR(50) NOT NULL,
    entity_id        UUID,
    is_read          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_user_id_is_read ON notification (user_id, is_read);
CREATE INDEX idx_notification_created_at ON notification (created_at);

CREATE TABLE audit_log (
    audit_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID NOT NULL REFERENCES users (user_id),
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_created_at ON audit_log (created_at);
CREATE INDEX idx_audit_log_actor_id ON audit_log (actor_id);
CREATE INDEX idx_audit_log_entity_type ON audit_log (entity_type);

CREATE TABLE broadcast_message (
    broadcast_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id  UUID NOT NULL REFERENCES department (department_id),
    author_id      UUID NOT NULL REFERENCES users (user_id),
    content        TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcast_message_department_id ON broadcast_message (department_id);
