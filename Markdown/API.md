# API Endpoint Specification — Project Management Web App

> Derived from `Project_Management_Functional_Requirements.pdf`, cross-referenced against `ERD.md`, `PRD.md`, and `SRS.md`. Organized by modular-monolith domain package (see prior architecture discussion). Role columns: **S**taff, **P**M, **L**eader, **A**dmin. `1` = allowed, `0` = not allowed, scoping notes where relevant.

---

## `auth` / session (shared)

Zitadel handles the actual login (OIDC redirect flow) — these are the endpoints the app itself owns.

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/me` | Current user profile + resolved permissions | 1 | 1 | 1 | 1 |
| PATCH | `/me/avatar` | Upload/change profile avatar | 1 | 1 | 1 | 1 |
| GET | `/me/stats` | Personal task/progress stats | 1 | 0 | 0 | 0 |
| POST | `/webhooks/zitadel/user-events` | Internal — syncs `USER.status` on lock/unlock events | — | — | — | — |
| POST | `/webhooks/netbird/connection-events` | Internal — syncs connection status (`USER.netbird_connected`/`netbird_last_seen`) | — | — | — | — |

Password change is Zitadel's own self-service page (out of app scope) — link out, don't proxy it.

---

## `workspace` — access requests & onboarding

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| POST | `/access-requests` | Submit request (unauthenticated) — `full_name`, `email`, `department_id` | — | — | — | — |
| GET | `/access-requests?department_id=&status=` | List requests — Admin scoped to own dept (per ERD's RBAC boundary note) | 0 | 0 | 0 | 1 |
| GET | `/access-requests/{id}` | Request detail | 0 | 0 | 0 | 1 |
| POST | `/access-requests/{id}/approve` | Provisions Zitadel identity + `USER` row | 0 | 0 | 0 | 1 |
| POST | `/access-requests/{id}/reject` | Closes request, no downstream effect | 0 | 0 | 0 | 1 |

**Open question:** locked-user re-request flow ("redirected back to request permission again") doesn't fit `ACCESS_REQUEST` as modeled (that table assumes no `USER` exists yet). Needs a decision before this endpoint set is final — either a distinct `unlock-requests` resource, or route locked users to a plain "contact admin" screen with no persisted request.

---

## `workspace` — users & departments

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/departments` | List departments — Staff/PM see own only; Leader/Admin see all | 1 | 1 | 1 | 1 |
| GET | `/departments/{id}/members` | Members in a workspace | 1 | 1 | 1 | 1 |
| GET | `/users?department_id=` | Enterprise-wide member list (no dept scoping) | 0 | 0 | 1 | 1 |
| GET | `/users/{id}` | Profile detail | 1 | 1 | 1 | 1 |
| PATCH | `/users/{id}/role` | Promote/demote — requires `confirm: true` in body, writes `AUDIT_LOG`. **Resolved rule:** an Admin cannot change another Admin's role (peer-protection, confirmed by UI mapping doc); self-demotion is allowed as the one exception, **except** when the acting Admin is the last remaining Admin account (blocked, to avoid leaving the system with zero admins) | 0 | 0 | 0 | 1 |
| POST | `/users/{id}/lock` | Body: `reason` (→ `USER.locked_reason`), triggers Zitadel lock, writes `AUDIT_LOG` | 0 | 0 | 0 | 1 |
| POST | `/users/{id}/unlock` | Writes `AUDIT_LOG` | 0 | 0 | 0 | 1 |
| GET | `/users/{id}/netbird-status` | Cached connection status (`USER.netbird_connected`/`netbird_last_seen`) | 0 | 0 | 0 | 1 |
| GET | `/departments/{id}/resource-allocation` | Workload view (PRD 5.3, tagged **S** — confirm still in scope) | 0 | 1 | 0 | 0 |
| GET | `/departments/{id}/performance-risk` | Aggregate performance/risk (SRS FR-4) | 0 | 0 | 1 | 0 |
| PATCH | `/departments/{id}/settings` | `DEPARTMENT` has no settings field/table yet | 0 | 0 | 0 | 1 |

---

## `workspace` — roles & authority matrix

Confirmed direction: **Option B** (admin-editable matrix) — matches the "Ma trận phân quyền" mockup already built, with Admin's row locked/non-editable both client- and server-side.

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/roles` | List the 4 fixed roles | 0 | 0 | 0 | 1 |
| GET | `/permissions` | Permission catalog (~25 rows, seeded from this FR table) | 0 | 0 | 0 | 1 |
| GET | `/roles/{id}/permissions` | View one role's matrix row | 0 | 0 | 0 | 1 |
| PUT | `/roles/{id}/permissions` | Adjust the matrix for Leader/PM/Staff, writes `AUDIT_LOG`. **Admin's row is immutable** — rejected with 403 if `role_id` resolves to Admin, seeded with all permissions at init. This is the server-side half of the self-lockout guard: the UI locks Admin's column, but the API enforces it too, since a client-side disable alone doesn't stop a direct API call | 0 | 0 | 0 | 1 |

---

## `project`

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/projects?department_id=&status=` | List — Staff/PM own dept only; Leader/Admin filterable across all | 1 | 1 | 1 | 1 |
| GET | `/projects/{id}` | Detail | 1 | 1 | 1 | 1 |
| POST | `/projects` | Create | 0 | 1 | 0 | 1 |
| PATCH | `/projects/{id}` | Edit | 0 | 1 | 0 | 1 |
| DELETE | `/projects/{id}` | Archive (soft delete) | 0 | 1 | 0 | 1 |
| GET | `/projects/{id}/tasks?include=milestones,tags,assignees` | Full task set for the project — Kanban, List, Gantt, and Calendar all render from this one payload; the 4-view split is a client-side layout decision, not 4 backend endpoints | 1 | 1 | 1 | 1 |

**Note:** Gantt is the one view with a real backend dependency — it needs `TASK.start_date` (added to `ERD.md`) alongside `due_date` to draw bar width. Kanban/List/Calendar need no schema beyond what's already here.

---

## `milestone`

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/projects/{id}/milestones` | List | 1 | 1 | 1 | 1 |
| POST | `/projects/{id}/milestones` | Create | 0 | 1 | 0 | 1 |
| PATCH | `/milestones/{id}` | Edit | 0 | 1 | 0 | 1 |
| DELETE | `/milestones/{id}` | Delete | 0 | 1 | 0 | 1 |

---

## `task`

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/projects/{id}/tasks` | List tasks (and subtasks via `parent_task_id`) | 1 | 1 | 1 | 1 |
| GET | `/tasks/{id}` | Detail | 1 | 1 | 1 | 1 |
| POST | `/projects/{id}/tasks` | Create task or subtask (`parent_task_id` optional) | 0 | 1 | 0 | 1 |
| PATCH | `/tasks/{id}` | Full edit: title, description, priority, deadline, ownership | 0 | 1 | 0 | 1 |
| PATCH | `/tasks/{id}/status` | Status update only — Staff limited to tasks/subtasks assigned to them | 1 | 1 | 0 | 1 |
| DELETE | `/tasks/{id}` | Delete task or subtask | 0 | 1 | 0 | 1 |
| POST | `/tasks/{id}/tags` | Attach tag | 0 | 1 | 0 | 1 |
| DELETE | `/tasks/{id}/tags/{tagId}` | Remove tag | 0 | 1 | 0 | 1 |

---

## `task` — comments & attachments

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/tasks/{id}/comments` | List | 1 | 1 | 1 | 1 |
| POST | `/tasks/{id}/comments` | Create | 1 | 1 | 1 | 1 |
| GET | `/tasks/{id}/attachments` | List | 1 | 1 | 1 | 1 |
| POST | `/tasks/{id}/attachments` | Upload via SharePoint/Graph API — rate-limited (app-config, not schema) | 1 | 1 | 1 | 1 |
| DELETE | `/attachments/{id}` | Remove — uploader or PM/Admin | 1* | 1 | 0 | 1 |

*\*Staff limited to attachments they uploaded themselves.*

---

## `notification`

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/notifications` | List — Staff/PM/Leader scoped to own workspace; Admin scoped to **all** workspaces (confirmed by the UI mapping doc — Admin's top-right notification box is explicitly "every workplace") | 1 | 1 | 1 | 1 |
| PATCH | `/notifications/{id}/read` | Mark read | 1 | 1 | 1 | 1 |
| POST | `/notifications/broadcast` | Leader-authored global message (`BROADCAST_MESSAGE`, fans out via `NOTIFICATION`) | 0 | 0 | 1 | 0 |

---

## `audit`

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/audit-logs?date=&actor_id=&entity_type=` | View one day's log. Defaults to **today** if `date` is omitted — this is the "reset" the FR doc describes: a UI default, not a deletion. Any prior day remains queryable the same way | 0 | 0 | 0 | 1 |
| GET | `/audit-logs/days` | List which days have entries, for the date-picker | 0 | 0 | 0 | 1 |
| GET | `/audit-logs/export?date=&format=csv` | Extract a chosen day's logs — **CSV only** (UI mapping doc drops PDF) | 0 | 0 | 0 | 1 |

**Resolved:** no rows are ever deleted — `AUDIT_LOG` stays a fully immutable trail, consistent with SRS FR-6/NFR-1's compliance framing, and matches the FR doc's own "still able to check" wording for prior days. "Reset after a day" is purely the UI defaulting to today's entries, not physical archival. To keep queries fast as the table grows over years: index `created_at` (and `actor_id`/`entity_type`), and consider Postgres date-based table partitioning if volume gets heavy — not an MVP concern. A hard deletion/retention policy is a separate, deliberate legal/compliance decision if one is ever needed — not something to build preemptively.

---

## `dashboard` (aggregate/composite endpoints)

| Method | Path | Description | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/dashboard/me` | Role-aware summary — content shape varies per role | 1 | 1 | 1 | 1 |
| GET | `/dashboard/enterprise` | Cross-workspace statistics view | 0 | 0 | 1 | 1 |

---

## Open items before implementation

**Resolved by `ERD.md` v2:**
1. ~~Add `MILESTONE` entity~~ — done.
2. ~~Add `TASK.description` field~~ — done.
3. ~~Add `USER.avatar_url` field~~ — done.
4. ~~Decide NetBird status caching mechanism~~ — done (`USER.netbird_connected` / `netbird_last_seen`, mirrors `USER.status`).
6. ~~Add `BROADCAST_MESSAGE` entity~~ — done.
7. ~~Resolve the locked-user re-request flow~~ — done (`ACCESS_REQUEST.request_type = UNLOCK_REQUEST`).

**Resolved by the UI mapping doc (`Project_Management_-_Functional_Requirements_for_UI.pdf`):**
8. ~~Reconcile the Admin notification-scope contradiction~~ — resolved, Admin's scope is confirmed all-workplace.
5. **Authority matrix — now strongly leaning Option B.** A dedicated "Authority Matrix Tab" in the UI mapping implies live admin editing, not a static hardcoded check. Still worth an explicit go/no-go before the auth layer is built, but the design signal now points clearly one direction.

**Resolved (this round):**
9. Multi-view is confirmed needed and is mostly a client-side rendering concern — collapsed to one shared `GET /projects/{id}/tasks` endpoint. Exception: Gantt needed `TASK.start_date` added to `ERD.md` for bar rendering.
10. Audit log "archive" resolved as a UI default (today's entries shown by default), not physical deletion — `AUDIT_LOG` stays fully immutable, matching FR-6/NFR-1.
11. Admin role-change rule refined: peer Admins can't change each other's role; self-demotion allowed, except for the last remaining Admin.
12. Confirmed copy-paste slip in the source doc (Admin's 4-view feature is "(Dashboard/Project Tab)" like every other role) — no action needed.

**Still open:**
- Authority matrix: leaning toward building it client-side as a simple role × permission grid (not per-user overrides), with a hard-coded guard against an Admin removing their own ability to edit the matrix. This confirms Option B (`PERMISSION`/`ROLE_PERMISSION`) on the backend — worth a final go/no-go before the auth layer is built.

*See also: [`ERD.md`](./ERD.md), [`PRD.md`](./PRD.md), [`SRS.md`](./SRS.md).*
