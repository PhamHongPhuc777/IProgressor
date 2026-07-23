# Endpoint testing progress

Tracking manual Postman verification against the real Zitadel + NetBird + Supabase stack (see
`postman/IProgressor.postman_collection.json`). Check off as each request is confirmed with a real
response, not just "looks right."

## Dev
- [x] Mint dev token

## Access Requests
- [x] Submit access request (public)
- [x] Approve access request (full Zitadel org/user + NetBird group/invite pipeline confirmed)
- [x] Re-test approve access request against the native-invite-email fix (real applicant flow:
      public submit -> approve -> Zitadel's native "Initialize User" email confirmed delivered via
      Brevo to a real inbox, not a curl force-verify/force-password shortcut).
- [x] Re-test approve access request against the `access_request.manage.all_departments` fix (V8) --
      approved a fresh "IT"-department request with the Admin dev token (own department
      "Administration"); confirmed cross-department, and confirmed the full chain (Zitadel user +
      local `users` row + NetBird invite, `status: "invited"` on the real NetBird account) all
      completed successfully in one call.
- [x] List access requests
- [x] Get access request by id
- [x] Reject access request

## Me
- [x] Get my profile
- [x] Update my avatar
- [x] Get my task stats

## Departments
- [x] List departments
- [x] List departments (public) -- new, backs the public access-request form's department picker
- [x] List department members
- [x] Resource allocation
- [x] Performance risk

## Projects
- [x] Search projects
- [x] Get project by id
- [x] Create project
- [x] Update project
- [x] Archive project (204, confirmed soft-delete via status column, not a real DELETE)

## Milestones
- [x] Create milestone
- [x] List milestones for project
- [x] Update milestone
- [x] Delete milestone

## Tasks
- [x] Create task
- [x] Add tag to task
- [x] Remove tag from task (confirmed catalog `tag` row is untouched by design -- only `task_tag` join row is deleted)
- [x] List tasks for project
- [x] Get task by id
- [x] Update task
- [x] Update task status
- [x] Delete task

## Comments
- [x] List comments for task
- [x] Create comment
- [x] Update comment (author-only, `task.comment.update` via V5 migration)
- [x] Delete comment (author-only, `task.comment.delete` via V5 migration)

## Attachments
- [x] List attachments for task
- [x] Upload attachment (needed `spring.servlet.multipart.max-file-size`/`max-request-size` raised to 10MB from Boot's 1MB default)
- [x] Delete attachment

## Notifications
- [x] Stream notifications (SSE) -- correctly hangs open (long-lived connection, not request/response); confirms it connects without erroring
- [x] Mark notification read
- [x] Send broadcast (also confirmed `broadcast_message.send` now granted to Admin via V6 migration, not just Leader)
- [ ] New access-request submission notifies approvers (added -- previously nothing notified anyone
      when a request came in; an Admin/Leader would only find out by polling
      `GET /access-requests?status=PENDING`). `AccessRequestService.submit()` now notifies every
      user holding `access_request.manage.all_departments` (company-wide) plus every user holding
      plain `access_request.manage` scoped to the request's own department -- mirrors the same
      permission check `approve()`/`reject()` enforce, via two new `UserMapper` queries
      (`findUserIdsByPermission`/`findUserIdsByPermissionAndDepartment`, `role_permission` JOIN
      `permission`). Not yet manually verified against a real SSE-connected client -- needs a
      restart + a real `POST /access-requests` while a Postman SSE stream is open on the Admin
      token to confirm.

## Users
- [x] Mint user token
- [x] List users (company-wide)
- [x] Get user by id
- [x] Change user role (self role-change Admin<->Leader, exercised while testing broadcast permission)
- [x] Lock user
- [x] Unlock user
- [x] Get user NetBird status (needs app restart to pick up `NetbirdStatusPollingJob`, see below)

## Test role identities (for role-gated endpoint coverage)
- Admin: dev-machine (`382159061275115522`), local `user_id` `dd832cbc-3be4-4ba4-ad3a-671b3c94e238`
- Leader: `test-leader` (`382593206048522243`)
- PM: `test-pm` (`382593403348582403`)
- Staff: `test-staff` (`382593403952562179`)
- All mint via `POST http://localhost:8081/oauth/v2/token` (Basic Auth = client id/secret), not `{{baseUrl}}`
- Real human user (not a machine account): `inappropriatehuman13@gmail.com`, provisioned via a real
  access-request approval, local `user_id` `382694828967723010` (Zitadel). Minted via a separate
  `postman-user-login` **User Agent** app (PKCE) + Postman's built-in OAuth 2.0 "Get New Access
  Token" (Authorization Code flow, browser-based login) -- ROPC (`grant_type=password`) is fully
  removed from Zitadel, not just disabled, so this is the only way to get a token for a genuine
  human identity rather than a machine/service account.

## Roles
- [x] List roles
- [x] List permissions
- [x] Get role permissions
- [x] Update role permissions (now `PATCH` with `{grant, revoke}` deltas, not a full-array replace --
      see below; confirmed against Leader, confirmed 403 "immutable" against Admin)

## Dashboard
- [x] My dashboard
- [x] Enterprise dashboard

## Audit
- [x] Search audit logs
- [x] Days with audit data
- [x] Export audit logs (CSV)

## Webhooks
- [x] Zitadel user event (guarded by `X-Webhook-Secret`, not bearer auth)
- [x] NetBird connection event (guarded by `X-Webhook-Secret`, not bearer auth)
- [x] NetBird connection status

## Known fixed issues along the way
- `ZITADEL_ISSUER_URI` default port typo (8082 -> 8081) in `application.yml`.
- Zitadel service-account PAT required exactly 5 dot-separated segments; two prior copies were
  malformed (one truncated, one over-long).
- Org creation needs **instance-level** `IAM_OWNER`, not just org-level `Org Owner` -- two separate
  grants in the Zitadel console.
- `RealZitadelProvisioningClient.ensureOrg()` now searches by org name before creating, since org
  creation is a real external side effect `@Transactional` rollback can't undo.
- `AddHumanUser`'s `organization` field must be a nested `{"orgId": "..."}` object, not a bare string.
- Postman collection's example bodies for milestone/task `status` used invalid values (`PENDING`,
  `TODO`, `DONE`) that don't match the DB check constraints -- fixed in the source collection file.
- `users.netbird_connected`/`netbird_last_seen` had no code path to ever update: NetBird Cloud
  doesn't emit peer-connection webhooks, and a webhook couldn't reach localhost anyway. Fixed by
  adding `NetBirdClient.pollConnectionStatuses()` (joins `/api/peers` to `/api/users` by
  `user_id` to get each connected peer's owning email) and a `NetbirdStatusPollingJob`
  (`@Scheduled(fixedDelay = 60_000)`) that syncs it into the local `users` row by email match.
  Requires an app restart to take effect; only updates a local user whose `email` exactly matches
  the invited NetBird account's email.
- New Zitadel OIDC apps default their **Auth Token Type** to "Bearer Token" (an opaque/encrypted
  reference token, Zitadel-internal JWE) rather than a self-contained signed JWT. Spring's resource
  server only verifies signed JWTs locally (no JWE key configured), so tokens from a freshly
  registered app 401 with `"Encrypted JWT rejected: No JWE key selector is configured"` until the
  app's Auth Token Type is switched to **JWT** in its console config.
- ROPC (`grant_type=password`) is not just disabled but fully removed from Zitadel ("due to growing
  security concerns"). Minting a token for a real human user (as opposed to a machine/service
  account) requires a separate PKCE "User Agent" app + Postman's OAuth 2.0 "Get New Access Token"
  (Authorization Code flow, real browser login) -- there is no server-to-server shortcut.
- `PUT /roles/{id}/permissions` originally replaced a role's *entire* permission set with whatever
  array was sent -- manually testing it with a single permission id (meant to just grant that one)
  silently wiped every other permission Leader had. Changed to `PATCH /roles/{id}/permissions` with
  `{"grant": [...], "revoke": [...]}` delta semantics instead (`RoleMapper.grantPermissions`/
  `revokePermissions`, `ON CONFLICT DO NOTHING` on the grant side) so a caller can never
  accidentally clear permissions they didn't mean to touch.
- The delta endpoint originally audited `UPDATE_ROLE_PERMISSIONS` unconditionally, even when a
  grant/revoke was a no-op (e.g. re-granting an already-granted permission) -- `grantPermissions`/
  `revokePermissions` now return actual affected-row counts, and `RoleService` only records an
  audit entry when at least one row really changed. The same id appearing in both `grant` and
  `revoke` in one request is now rejected with a 400 rather than silently resolved by execution
  order (grant-then-revoke would otherwise make revoke win silently).
- `POST /access-requests` requires a `departmentId`, but `GET /departments` needed
  `workspace.members.view` -- an unauthenticated prospective employee had no way to even see
  department names to pick from. Added `GET /departments/public` (`permitAll`, id+name only, no
  `zitadelOrgId`/`netbirdGroupId`) to back the public registration form's department picker.
  `V7__seed_default_departments.sql` seeds IT/Marketing/HR/Accounting as the default set (idempotent
  `ON CONFLICT (name) DO NOTHING`, same pattern as V3's admin-bootstrap department).
- The public department picker would otherwise have included the admin-bootstrap department
  ("Administration") as a selectable option -- approval always assigns the `Staff` role regardless
  of department so it's not a privilege-escalation path, but letting a public registrant target the
  bootstrap-only department is still confusing/wrong. `findAllPublic` now excludes it by name
  (`app.admin-bootstrap.department-name`), while the authenticated `GET /departments` still includes
  it for internal use.
- Neither this app nor self-hosted Zitadel had any SMTP configured -- Zitadel owns all
  identity-related email (verification codes, password resets) and already has a built-in SMTP
  provider setting, so the app itself doesn't need `spring-boot-starter-mail`. Ruled out EmailJS
  (client-side-only REST API, no SMTP relay, would force a server-issued secret through the
  browser) and Mailpit (self-hosted dev catcher, never actually delivers -- fine for local dev, a
  dead end for the real employee beta). Initially picked Postmark, but its signup flow outright
  blocks personal Gmail/Yahoo addresses (anti-abuse policy -- would've needed to buy a domain
  first just to create an account); switched to **Brevo** instead, which accepts a personal
  signup email and only requires verifying a single sender address, not a domain. Since this
  Zitadel instance is already bootstrapped, `ZITADEL_FIRSTINSTANCE_SMTPCONFIGURATION_*` env vars
  are a no-op (first-init only) -- wired in instead via the Admin API's `AddEmailProviderSMTP` +
  `ActivateEmailProvider`, confirmed working end-to-end against the real local instance. Zitadel's
  own rendered docs page for `AddEmailProviderSMTP` shows the wrong request shape (nests
  `senderAddress`/`senderName`/`host`/`user` under `plain`/`none`/`xoauth2`) -- the real
  `admin.proto` shows those are top-level fields on the request, and only `password` belongs
  inside `plain`. Sending the docs page's shape silently drops `senderAddress` and fails with
  `"value length must be between 1 and 200 runes"`. See `markdown/SETUP.md`'s "Email (SMTP for
  Zitadel)" section for the corrected request body. Verified end-to-end via
  `POST /v2/users/{userId}/password_reset` (v2, instance-wide) -- the deprecated org-scoped
  `management/v1/users/{id}/password/_reset` 404s for a user provisioned into a non-default org
  without an `x-zitadel-orgid` header. Real reset + password-changed emails both landed in the
  primary inbox, correctly branded.
- `RealZitadelProvisioningClient.createHumanUser` was silently suppressing Zitadel's own invite
  email, undetected until SMTP existed to notice: it set `email.isVerified = false` and a random,
  never-shared password. `SetHumanEmail.verification` is a `oneof` (`sendCode`/`returnCode`/
  `isVerified`) -- explicitly setting `isVerified` to `false` still *selects that branch*, which
  suppresses the send; only leaving the whole `email` verification field unset triggers Zitadel's
  default "send an email with the default url" behavior (confirmed against the real
  `user_service/v2/email.proto` on GitHub). The random password compounded this -- even if the
  email had gone out, there was nothing for the applicant to actually log in with. Fixed by
  omitting both the password field and the verification oneof entirely, so Zitadel sends its
  native "Initialize User" email (set password + verify email in one link) instead. Requires SMTP
  to be live on this Zitadel instance (see above) or the account is created but the invite never
  arrives.
- Zitadel's hosted login page ships with self-registration (`allowRegister`) and external-IDP
  signup (`allowExternalIdp`, e.g. "Sign in with Google") both enabled by default -- discovered by
  actually authenticating with Google on the login page and getting a real Zitadel-issued JWT for
  an identity that was never provisioned through `AccessRequestService.approve()`.
  `LocalUserJwtAuthenticationConverter` correctly 401s it (`"No local account provisioned for this
  identity"`, since it resolves every JWT against the local `users` table rather than trusting
  claims), so nothing was actually broken -- but it leaves stray, permanently-unusable Zitadel
  identities lying around, which could later collide with a genuine access-request approval for the
  same email. Disabled both instance-wide via `PUT /admin/v1/policies/login` -- see `markdown/SETUP.md`
  step 4 for the exact request body (the endpoint replaces the whole policy object, so every other
  field has to be carried forward from a prior `GET`).
- Wanted Google sign-in usable for *already-approved* employees (most use Gmail) without reopening
  the self-registration hole just closed above. `allowExternalIdp` on the login policy isn't scoped
  to registration only -- it gates external-IDP login entirely, so leaving it off would've blocked
  Google sign-in outright. The real lever is per-IDP, not the login policy: Google's configured IDP
  had `isCreationAllowed: true` (lets Google auth create a brand new account, exactly what caused
  the original problem) and no `autoLinking`. Fixed via `PUT /admin/v1/idps/google/{id}` --
  `isCreationAllowed: false` (blocks any new account via Google), `isLinkingAllowed: true` +
  `autoLinking: AUTO_LINKING_OPTION_EMAIL` (prompts to link Google to an existing account when the
  verified email matches), then re-enabled `allowExternalIdp` on the login policy. Confirmed a
  random Google email with no matching account gets refused (`isCreationAllowed: false`), while a
  known account requires its Zitadel email to actually be *verified* first for the auto-link email
  match to trigger -- an unverified email silently falls through to the (now-blocked) creation path
  instead of prompting to link.
- Verification/invite emails silently vanished (no bounce, not in spam) despite Zitadel logging a
  clean send and Brevo's own delivery log showing `Sent`. Root cause: `BREVO_SENDER_ADDRESS` was a
  free-provider address (first the tester's own Gmail, tried Outlook.com next with the same
  result), which fails SPF/DKIM alignment through Brevo's servers and gets caught by the
  recipient's heuristic spam filtering regardless of the sender domain's own (lenient) DMARC policy.
  Real fix was authenticating a real owned domain (`all-rounder.win`) with Brevo and switching to
  `noreply@all-rounder.win` -- see `markdown/SETUP.md`'s "Email (SMTP for Zitadel)" section for the
  full diagnostic trail, the Cloudflare "CNAME must be DNS-only not Proxied" gotcha, and the correct
  (non-deprecated) `UpdateEmailProviderSMTP` endpoint to push the change live.
- `access_request.manage` is Admin-only (V2), and `AccessRequestService` department-scoped it
  exactly like a department Leader -- but Admin's own department ("Administration", a
  dev/bootstrap-only department from V3, not public-facing) is never the target department of a
  real access request. As seeded, **no access request for any real department could ever be
  approved by anyone** -- not a design tradeoff, an actual dead end, caught by trying to approve an
  "IT"-department request with the Admin dev token and getting a 403. Fixed by adding
  `access_request.manage.all_departments` (V8, granted to Admin only, since the Admin permission
  row is immutable via the runtime API per `RoleService.updateRolePermissions`) and checking it in
  `AccessRequestService.list()`/`requireOwnDepartment()`, mirroring the existing
  `project.view.all_departments` pattern in `ProjectService`/`DepartmentService`/`DashboardService`
  rather than special-casing the Admin role name. Also had to fix `AccessRequestMapper.xml`'s
  `findByDepartment`/`countByDepartment`, which did an unconditional `department_id = #{departmentId}`
  -- passing `null` for "all departments" would've silently matched zero rows instead of removing
  the filter, unlike `ProjectMapper`'s equivalent queries which already wrapped it in
  `<if test="departmentId != null">`.
- The V8 fix above surfaced a real transactional-boundary bug while retesting: approving an access
  request whose email NetBird rejected with `409` ("can't invite a user with an existing netbird
  account" -- that email had some unrelated pre-existing NetBird identity, confirmed absent from
  our own team's `/api/users`) threw an unhandled `HttpClientErrorException`, producing a generic
  500. `@Transactional` rolled back the local `users` row and the access-request status, but
  **can't** undo the Zitadel account that `RealZitadelProvisioningClient.createHumanUser` had
  already created moments earlier -- a real external side effect, same class of problem `ensureOrg`
  already had a fix for (name-based lookup before creating), just not applied to human users yet.
  Confirmed via `POST /v2/users` (email-filtered `ListUsers`) that a live, orphaned Zitadel account
  existed with no matching local row. Fixed two things: (1) `provisionUser` now looks up an
  existing Zitadel user by email first and reuses it instead of blindly creating, so a retry
  self-heals instead of colliding on Zitadel's unique-email constraint; (2) `RealNetBirdClient`
  catches NetBird's `409` specifically and throws a `ConflictException` with an actionable message
  instead of leaking the raw exception as a 500. The underlying NetBird conflict itself isn't
  fixable from this app's side (it's a real pre-existing identity on NetBird's platform) --
  confirmed the whole fixed chain (Zitadel reuse + clear 409) by retrying the same request and
  getting the clean actionable error, then confirmed the full happy path separately with a NetBird-
  clean email (Zitadel user + local row + NetBird invite, `status: "invited"`, all succeeded in one
  call, cross-department via the V8 permission).
