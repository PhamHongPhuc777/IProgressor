# Entity Relationship Diagram — Project Management Web App

> Converted from `Entity Relationship Diagram - Project Management Web App.drawio` for repo review/reference. Diagram is redrawn as a [Mermaid](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) `erDiagram`, which GitHub renders natively in Markdown — no external viewer needed. Entity names, field names, and PK/FK markers are unchanged from the source `.drawio` file, **except for the additions below**.

## Diagram

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : employs
    DEPARTMENT ||--o{ PROJECT : owns
    ROLE ||--o{ USER : grants
    USER ||--o{ PROJECT : manages
    PROJECT ||--o{ PROJECT_MEMBER : includes
    USER ||--o{ PROJECT_MEMBER : joins
    PROJECT ||--o{ MILESTONE : "broken into"
    MILESTONE ||--o{ TASK : groups
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ TASK : "has subtask"
    USER ||--o{ TASK : "assigned to"
    TASK ||--o{ COMMENT : has
    USER ||--o{ COMMENT : writes
    TASK ||--o{ ATTACHMENT : has
    PROJECT ||--o{ ATTACHMENT : has
    TASK ||--o{ TASK_TAG : tagged
    TAG ||--o{ TASK_TAG : labels
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : performs
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : "granted via"
    USER ||--o{ BROADCAST_MESSAGE : authors
    DEPARTMENT ||--o{ BROADCAST_MESSAGE : "targeted at"
    BROADCAST_MESSAGE ||--o{ NOTIFICATION : "fans out to"
    ZITADEL ||--o{ DEPARTMENT : federates
    ZITADEL ||--o{ USER : authenticates
    SHAREPOINT ||--o{ ATTACHMENT : stores
    NETBIRD ||--o{ USER : "gates access"
    DEPARTMENT ||--o{ ACCESS_REQUEST : receives
    USER ||--o{ ACCESS_REQUEST : reviews
    USER ||--o| ACCESS_REQUEST : provisions
    USER ||--o| ACCESS_REQUEST : "re-requests via"

    DEPARTMENT {
        uuid department_id PK
        string name
        string zitadel_org_id
    }
    ROLE {
        uuid role_id PK
        string name
    }
    USER {
        uuid user_id PK
        string full_name
        string email
        uuid department_id FK
        uuid role_id FK
        string zitadel_user_id
        string status
        string locked_reason
        string avatar_url
        boolean netbird_connected
        timestamp netbird_last_seen
    }
    ACCESS_REQUEST {
        uuid request_id PK
        string request_type
        string full_name
        string email
        uuid department_id FK
        uuid existing_user_id FK
        string status
        timestamp requested_at
        uuid reviewed_by FK
        timestamp reviewed_at
        uuid created_user_id FK
    }
    PROJECT {
        uuid project_id PK
        string name
        uuid department_id FK
        uuid owner_id FK
        string status
        date start_date
        date end_date
    }
    PROJECT_MEMBER {
        uuid project_id FK
        uuid user_id FK
        string project_role
    }
    MILESTONE {
        uuid milestone_id PK
        uuid project_id FK
        string name
        date due_date
        string status
    }
    TASK {
        uuid task_id PK
        uuid project_id FK
        uuid milestone_id FK
        uuid parent_task_id FK
        uuid assignee_id FK
        string title
        text description
        string status
        string priority
        date due_date
    }
    COMMENT {
        uuid comment_id PK
        uuid task_id FK
        uuid author_id FK
        text content
        timestamp created_at
    }
    ATTACHMENT {
        uuid attachment_id PK
        uuid task_id FK
        uuid project_id FK
        string storage_type
        string sharepoint_item_id
        string url
    }
    TAG {
        uuid tag_id PK
        string name
    }
    TASK_TAG {
        uuid task_id FK
        uuid tag_id FK
    }
    NOTIFICATION {
        uuid notification_id PK
        uuid user_id FK
        string entity_type
        uuid entity_id
        boolean is_read
        timestamp created_at
    }
    AUDIT_LOG {
        uuid audit_id PK
        uuid actor_id FK
        string action
        string entity_type
        uuid entity_id
        timestamp created_at
    }
    PERMISSION {
        uuid permission_id PK
        string key
        string description
    }
    ROLE_PERMISSION {
        uuid role_id FK
        uuid permission_id FK
    }
    BROADCAST_MESSAGE {
        uuid broadcast_id PK
        uuid department_id FK
        uuid author_id FK
        text content
        timestamp created_at
    }
```

`ZITADEL`, `NETBIRD`, and `SHAREPOINT` are external systems (no owned schema in this database) — see [External systems](#external-systems) below for their role.

## Entities & fields

### DEPARTMENT

| Field | Type | Key |
|---|---|---|
| department_id | uuid | PK |
| name | string | |
| zitadel_org_id | string | |

### ROLE

| Field | Type | Key |
|---|---|---|
| role_id | uuid | PK |
| name | string | |

### USER

| Field | Type | Key |
|---|---|---|
| user_id | uuid | PK |
| full_name | string | |
| email | string | |
| department_id | uuid | FK → DEPARTMENT |
| role_id | uuid | FK → ROLE |
| zitadel_user_id | string | |
| status | string | `ACTIVE` \| `LOCKED` — cached copy of the account's lock state, synced from Zitadel via webhook/event |
| locked_reason | string | Optional, nullable. App-local note (e.g. "resigned", "under investigation") — not identity data, so it doesn't live in Zitadel |
| avatar_url | string | Nullable. Profile avatar — supports "Change Profile Avatar" (all roles) |
| netbird_connected | boolean | Cached, read-only. Synced from NetBird via webhook/poll — see [NetBird connection status](#netbird-connection-status) |
| netbird_last_seen | timestamp | Nullable. Last time NetBird reported this user as connected |

### ACCESS_REQUEST

Pre-account state **or** re-request after lockout — see [Access request / onboarding flow](#access-request--onboarding-flow).

| Field | Type | Key |
|---|---|---|
| request_id | uuid | PK |
| request_type | string | `NEW_ACCOUNT` (default) \| `UNLOCK_REQUEST` |
| full_name | string | |
| email | string | |
| department_id | uuid | FK → DEPARTMENT (requested) |
| existing_user_id | uuid | FK → USER, nullable — set when `request_type = UNLOCK_REQUEST`, links to the already-existing locked account |
| status | string | `PENDING` \| `APPROVED` \| `REJECTED` |
| requested_at | timestamp | |
| reviewed_by | uuid | FK → USER, nullable — admin who approved/rejected |
| reviewed_at | timestamp | nullable |
| created_user_id | uuid | FK → USER, nullable — set once approval provisions the account (NEW_ACCOUNT flow only) |

### PROJECT

| Field | Type | Key |
|---|---|---|
| project_id | uuid | PK |
| name | string | |
| department_id | uuid | FK → DEPARTMENT |
| owner_id | uuid | FK → USER |
| status | string | |
| start_date | date | |
| end_date | date | |

### PROJECT_MEMBER *(join table: PROJECT ↔ USER)*

| Field | Type | Key |
|---|---|---|
| project_id | uuid | FK → PROJECT |
| user_id | uuid | FK → USER |
| project_role | string | |

### MILESTONE

| Field | Type | Key |
|---|---|---|
| milestone_id | uuid | PK |
| project_id | uuid | FK → PROJECT |
| name | string | |
| due_date | date | |
| status | string | |

### TASK

| Field | Type | Key |
|---|---|---|
| task_id | uuid | PK |
| project_id | uuid | FK → PROJECT |
| milestone_id | uuid | FK → MILESTONE, nullable — a task may belong to a milestone or attach directly to the project |
| parent_task_id | uuid | FK → TASK (self, for subtasks) |
| assignee_id | uuid | FK → USER |
| title | string | |
| description | text | Nullable. Free-text task detail, distinct from `title` — supports "Update Task's Description" (PM/Admin) |
| status | string | |
| priority | string | |
| due_date | date | |

### COMMENT

| Field | Type | Key |
|---|---|---|
| comment_id | uuid | PK |
| task_id | uuid | FK → TASK |
| author_id | uuid | FK → USER |
| content | text | |
| created_at | timestamp | |

### ATTACHMENT

| Field | Type | Key |
|---|---|---|
| attachment_id | uuid | PK |
| task_id | uuid | FK → TASK |
| project_id | uuid | FK → PROJECT |
| storage_type | string | |
| sharepoint_item_id | string | |
| url | string | |

### TAG

| Field | Type | Key |
|---|---|---|
| tag_id | uuid | PK |
| name | string | |

### TASK_TAG *(join table: TASK ↔ TAG)*

| Field | Type | Key |
|---|---|---|
| task_id | uuid | FK → TASK |
| tag_id | uuid | FK → TAG |

### NOTIFICATION

| Field | Type | Key |
|---|---|---|
| notification_id | uuid | PK |
| user_id | uuid | FK → USER |
| entity_type | string | Includes `BROADCAST_MESSAGE` alongside existing types (`TASK`, `COMMENT`, etc.) |
| entity_id | uuid | Polymorphic — no DB-level FK constraint, same as v1 |
| is_read | boolean | |
| created_at | timestamp | |

### AUDIT_LOG

| Field | Type | Key |
|---|---|---|
| audit_id | uuid | PK |
| actor_id | uuid | FK → USER |
| action | string | |
| entity_type | string | |
| entity_id | uuid | |
| created_at | timestamp | |

### PERMISSION

Seed data mirrors the ~25 rows of the Functional Requirements table (e.g. `task.status.update`, `task.crud`, `project.crud`, `audit_log.view`, `user.role.change` …).

| Field | Type | Key |
|---|---|---|
| permission_id | uuid | PK |
| key | string | Stable machine-readable code, e.g. `task.status.update` |
| description | string | Human-readable label, e.g. "Update Task's Status" |

### ROLE_PERMISSION *(join table: ROLE ↔ PERMISSION)*

| Field | Type | Key |
|---|---|---|
| role_id | uuid | FK → ROLE |
| permission_id | uuid | FK → PERMISSION |

### BROADCAST_MESSAGE

| Field | Type | Key |
|---|---|---|
| broadcast_id | uuid | PK |
| department_id | uuid | FK → DEPARTMENT — the workspace the message targets |
| author_id | uuid | FK → USER (Leader) |
| content | text | |
| created_at | timestamp | |

## Relationships

| From | To | Relationship | Cardinality |
|---|---|---|---|
| DEPARTMENT | USER | employs | 1 : N |
| DEPARTMENT | PROJECT | owns | 1 : N |
| ROLE | USER | grants | 1 : N |
| USER | PROJECT | manages (owner) | 1 : N |
| PROJECT | PROJECT_MEMBER | includes | 1 : N |
| USER | PROJECT_MEMBER | joins | 1 : N |
| PROJECT | MILESTONE | broken into | 1 : N |
| MILESTONE | TASK | groups | 1 : N |
| PROJECT | TASK | contains | 1 : N |
| TASK | TASK | has subtask (self-reference via parent_task_id) | 1 : N |
| USER | TASK | assigned to | 1 : N |
| TASK | COMMENT | has | 1 : N |
| USER | COMMENT | writes | 1 : N |
| TASK | ATTACHMENT | has | 1 : N |
| PROJECT | ATTACHMENT | has | 1 : N |
| TASK | TASK_TAG | tagged | 1 : N |
| TAG | TASK_TAG | labels | 1 : N |
| USER | NOTIFICATION | receives | 1 : N |
| USER | AUDIT_LOG | performs | 1 : N |
| ROLE | ROLE_PERMISSION | has | 1 : N |
| PERMISSION | ROLE_PERMISSION | granted via | 1 : N |
| USER | BROADCAST_MESSAGE | authors | 1 : N |
| DEPARTMENT | BROADCAST_MESSAGE | targeted at | 1 : N |
| BROADCAST_MESSAGE | NOTIFICATION | fans out to (polymorphic, via entity_type/entity_id) | 1 : N |
| DEPARTMENT | ACCESS_REQUEST | receives | 1 : N |
| USER | ACCESS_REQUEST | reviews (admin) | 1 : N |
| USER | ACCESS_REQUEST | provisions (created account) | 1 : 0..1 |
| USER | ACCESS_REQUEST | re-requests via (locked account, UNLOCK_REQUEST) | 1 : 0..N |

`PROJECT_MEMBER`, `TASK_TAG`, and `ROLE_PERMISSION` are association/join tables — together they express the underlying many-to-many relationships (PROJECT↔USER, TASK↔TAG, and ROLE↔PERMISSION respectively).

## External systems

| System | Role | Integration |
|---|---|---|
| **Zitadel** (self-host) | IAM / SSO | Federates each DEPARTMENT as a Zitadel Organization (org-per-department multi-tenancy); authenticates USER via OIDC |
| **NetBird** (self-host) | Zero-trust admin VPN | Gates network-level access for USER; identity source is OIDC-linked to Zitadel |
| **SharePoint** | Document storage | Stores ATTACHMENT content, accessed via Microsoft Graph API |

## Account lock/unlock

Locking a user account is treated as a **Zitadel-level action**, not an app-level one, consistent with Zitadel being the single authority for identity across both this app and NetBird (an admin locking a user should cut off app access *and* NetBird VPN access in one action, not leave a half-locked state).

- The admin action goes through Zitadel's user lifecycle state (distinct from deactivation), not a flag owned by this database.
- `USER.status` is a **read-only local cache** of that state, kept in sync via a Zitadel webhook/event listener, so the app can filter "active" users (e.g. assignee pickers, workload dashboards) without a live API call on every request. It is never the source of truth and should not be toggled directly by app code — enforcement of the actual lock happens via Zitadel (token no longer validates) and, for defense-in-depth, by checking this cached field at the Spring Security layer.
- `USER.locked_reason` is app-local metadata Zitadel has no concept of, entered by the admin performing the lock.
- The lock/unlock action itself is recorded as a normal `AUDIT_LOG` row (`action = 'LOCK_USER'` / `'UNLOCK_USER'`, `actor_id` = admin, `entity_type = 'USER'`, `entity_id` = target user) — no new entity needed, per FR-6's existing audit model.
- A locked user asking to be reinstated does so through `ACCESS_REQUEST` with `request_type = UNLOCK_REQUEST` and `existing_user_id` set — see below.

## NetBird connection status

The FR table's Admin capability "View which account is accessed correctly with NetBird" needs a queryable per-user state, which v1 didn't model (NetBird was only a network-level gate, not a data source).

- `USER.netbird_connected` and `USER.netbird_last_seen` are **read-only local caches**, following the exact same pattern as `USER.status` — synced via a NetBird webhook or scheduled poll, never written directly by app code.
- This is purely informational for the Admin UI; it does not itself enforce access — the actual gate is still NetBird's own network policy, OIDC-linked to Zitadel.


## Broadcast messaging

The FR document gives Leader a capability with no v1 equivalent: sending a global message to an entire workspace, surfaced in each member's notification box.

- `BROADCAST_MESSAGE` is a lightweight table: one row per message, scoped to a `department_id` (the "workplace" being messaged) and authored by a `USER` (a Leader).
- Delivery reuses the existing polymorphic `NOTIFICATION` pattern already used for tasks/comments — one `NOTIFICATION` row is fanned out per department member, with `entity_type = 'BROADCAST_MESSAGE'` and `entity_id = broadcast_id`. No new delivery mechanism was needed, just a source-of-truth row to point at (and to audit/export later if needed) rather than duplicating message content across every fanned-out notification.

---

*See also: [`PRD.md`](./PRD.md) for product context, [`SRS.md`](./SRS.md) for the functional requirements this data model supports, [`API_Endpoints.md`](./API_Endpoints.md) for the endpoint spec derived from this schema.*
