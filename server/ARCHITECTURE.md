# How this codebase is organized

You already know layered architecture: one `controllers/` folder, one `services/` folder, one
`repositories/` folder, everything of the same *kind* lives together. This codebase instead
organizes by **domain first, layer second** — so instead of one big layered structure, you get
many small ones, one per feature, each repeating the same internal shape.

Once you see the repeating shape, every folder becomes readable the same way.

## The repeating shape

Every domain folder (`project/`, `milestone/`, `workspace/user/`, `task/task/`, ...) contains up
to four "spine" files, plus an optional `dto/` subfolder:

| Layered term (what you know)     | File in this codebase        | Role |
|-----------------------------------|-------------------------------|------|
| Model / Entity                    | `Entity.java` (bare name)     | The DB row shape, one field per column |
| Repository / DAO                  | `EntityMapper.java` (+ XML)   | SQL access. Interface here, query in `resources/mapper/EntityMapper.xml` |
| Service                           | `EntityService.java`          | Business rules, permission scoping, calls to `AuditService`, orchestration |
| Controller                        | `EntityController.java`       | HTTP mapping, `@PreAuthorize`, request validation |
| Request/response shapes           | `dto/*.java`                  | Everything that isn't the raw entity: create/update request bodies, trimmed or composed response views |

So `workspace/user/` is: `User.java` (model) + `UserMapper.java` (repository) + `UserService.java`
(service) + `UserController.java` (controller) + `dto/` (5 files: summaries, role-change/lock
requests, etc). That's the exact same shape a layered app has — just scoped to one feature instead

## Module boundaries are enforced, not just conventional

Every `EntityMapper` is a module's *private* persistence layer -- other modules that need its data
call the module's `Service` instead (its public API), never the `Mapper` directly. This is checked
by `src/test/java/com/example/server/architecture/ModularityTest.java` (ArchUnit), which fails the
build if any class outside a `Mapper`'s own package depends on it. It runs as a normal test (pure
bytecode analysis, no Spring context, no database) -- `./gradlew test`.

This is why some Services inject other domains' *Service* (e.g. `MilestoneService` depends on
`ProjectService`, not `ProjectMapper`, for its "does this project exist and can I see it" check) --
that's an intentional, allowed cross-module call. `dto`/model types crossing package lines is also
fine (a Service's return type *is* its public API); only reaching into another package's `Mapper`
is blocked.
of spread across the whole app.

**No `Task.java`?** Some domains don't have a single canonical entity file because the "read
shape" is a join, not a raw row: `task/task/dto/TaskRow.java` is the raw row, `TaskView.java` adds
the tag list computed from a separate query. Two DTOs standing in for one entity — same idea, just
the entity itself is a composed view rather than a 1:1 table mapping.

**Not every folder gets a `dto/`.** `task/attachment/` has none — its only "input" is a raw file
upload (`MultipartFile`), not a JSON body, so there's no request shape to put there. If a folder
has no `dto/`, that's a signal it has no custom request/response shapes, not a gap.

## The five folders that don't follow the pattern

These aren't features with a model/mapper/service/controller — they're cross-cutting concerns that
every feature relies on:

| Folder | Answers | Runs when |
|---|---|---|
| `common/` | "What does every API response/error look like?" | Every request (envelope, pagination, exception handling) |
| `config/` | "How is Spring itself wired?" | App startup (security filter chain, CORS, static resources) |
| `security/` | "Who is calling us, what can they do?" | Every authenticated request, before it reaches a controller |
| `webhook/` | "An external system is telling us something happened" | Zitadel/NetBird POSTing to us (inbound, no JWT) |
| `integration/` | "We need to ask an external system to do something" | Mid-request, when a service needs Zitadel/SharePoint (outbound) |

Full breakdown of these was covered in conversation above — the short version: `security/` and
`webhook/` both handle *incoming* traffic (one from users via JWT, one from external systems via
shared-secret), `integration/` is the only *outgoing* one.

## Full directory map

```
common/                      Response envelope, pagination, exceptions, global exception handler
common/exception/            NotFoundException, ForbiddenException, ConflictException, BadRequestException

config/
  SecurityConfig.java        Spring Security filter chain, JWT resource server wiring, 401/403 JSON bodies
  WebConfig.java              CORS, static file serving for local attachment uploads

security/                    JWT -> local user resolution (see request trace #1 below)
security/dev/                Dev-only JWT stub (no Zitadel needed locally)

integration/zitadel/         Outbound: provision a Zitadel identity on access-request approval
integration/storage/         Outbound: store an attachment (SharePoint stand-in for now)

webhook/                     Inbound: Zitadel/NetBird push user-lock and connection events to us

audit/                       Append-only AUDIT_LOG -- write side used by every mutating service,
                              read side is its own Admin-only endpoint

workspace/department/        Department entity + workload/performance-risk aggregation queries
workspace/role/               Role + Permission + the editable ROLE_PERMISSION matrix
workspace/user/               User entity, admin user management (role change, lock/unlock)
workspace/accessrequest/      Anonymous signup request -> Admin approve/reject -> provisions a User

project/                     Project entity, department-scoped CRUD
milestone/                   Milestone entity, nested under a project

task/task/                   Task entity (as TaskRow/TaskView), status updates, tag attach/detach
task/comment/                Comment entity, nested under a task
task/attachment/             Attachment entity, nested under a task (no dto/, see above)
task/tag/                    Tag entity -- just the catalog; attach/detach logic lives in task/task/

notification/notification/    Notification entity, list/stream(SSE)/markRead
notification/broadcast/       BroadcastMessage entity -- creates a broadcast, fans out via
                              notification.notification.NotificationService

me/                           Composition layer: "my own profile" (User + role/department names +
                              permissions) and "my own task stats" -- pulls from 3+ other packages
dashboard/                    Composition layer: role-dependent home dashboard + enterprise rollup
```

## Request trace #1: same-package flow

`PATCH /api/v1/tasks/{id}/status` — a Staff member marks their own task complete.

1. **`config/SecurityConfig`** — request hits the filter chain, not in the `permitAll` list, so it needs a valid bearer token
2. **`security/LocalUserJwtAuthenticationConverter`** — decodes the JWT, looks up `security/SecurityMapper.findAuthUserByZitadelUserId(sub)`, loads that role's permissions, builds `security/AuthenticatedUser`
3. **`task/task/TaskController.updateStatus()`** — `@PreAuthorize("hasAuthority('task.status.update')")` passes (Staff has it); `@RequestBody` deserializes into `task/task/dto/UpdateTaskStatusRequest`
4. **`task/task/TaskService.updateStatus()`** — loads the task via `TaskMapper`, checks project-department visibility, then the Staff-specific rule: `actor.userId().equals(row.assigneeId())` (this is the row-level check that couldn't be a single `@PreAuthorize` — see `AttachmentService` for the same pattern), calls `audit/AuditService.record(...)`
5. **`task/task/TaskMapper.updateStatus()`** (interface) → **`resources/mapper/TaskMapper.xml`** (the actual SQL) → Postgres
6. Response rebuilt as `task/task/dto/TaskView` (row + tags), wrapped in `common/ApiResponse.ok(...)`

Every step after #2 stayed inside `task/task/` except the security prelude and the audit call —
that's the point of the domain-first split: one feature, one place to look.

## Request trace #2: cross-package composition flow

`POST /api/v1/notifications/broadcast` — a Leader sends a workspace-wide announcement.

1. Security prelude same as above; `@PreAuthorize("hasAuthority('broadcast_message.send')")`
2. **`notification/notification/NotificationController.broadcast()`** — note the controller for the
   `/notifications/*` URL prefix lives in the `notification` sub-package, but delegates to...
3. **`notification/broadcast/BroadcastService.broadcast()`** — inserts the `BroadcastMessage` row via
   `BroadcastMapper`, then calls **`notification/notification/NotificationService.notifyDepartment()`**
   (a public method on the *other* sub-package's service — this is the one legitimate cross-package
   coupling in this feature, because "deliver a notification" is genuinely one concern shared by
   both entities)
4. **`NotificationService.notifyDepartment()`** loops every user in the department (via
   `workspace/user/UserMapper.findUserIdsByDepartment`), calling `notifyUser()` per person: insert a
   `Notification` row, then push it live through **`SseEmitterRegistry`** to anyone with an open
   `GET /notifications/stream` connection
5. Response is the created `BroadcastMessage`

This is the messier, more realistic case: two entities (`Notification`, `BroadcastMessage`) that
are conceptually separate (separate tables, separate mappers) but share one delivery mechanism.
Rather than duplicate the insert+push logic, `broadcast/` calls into `notification/`'s service.

## Quick lookup: "I need to..."

| Task | Where to look |
|---|---|
| Add a field to how a task looks in the API response | `task/task/dto/TaskView.java` + `TaskMapper.xml` |
| Add a new permission-gated action on an existing entity | `EntityService.java` (business rule) + `EntityController.java` (`@PreAuthorize`) + maybe seed a new permission in `V2__seed_roles_and_permissions.sql` |
| Change what counts as "visible" to a role | Look for `requireProjectVisible`/`requireVisibility`-style private methods in that domain's `Service.java` |
| Add a new external system call | New subfolder under `integration/` |
| Add a new inbound event from an external system | New method on `webhook/WebhookController` + `WebhookService` |
| Change JWT/permission resolution itself | `security/LocalUserJwtAuthenticationConverter.java` |
| Add a brand-new top-level feature | Mirror an existing domain folder: `Entity.java`, `EntityMapper.java` (+XML), `EntityService.java`, `EntityController.java`, `dto/` if it needs custom request/response shapes |
