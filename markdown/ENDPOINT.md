# Endpoint testing progress

Tracking manual Postman verification against the real Zitadel + NetBird + Supabase stack (see
`postman/IProgressor.postman_collection.json`). Check off as each request is confirmed with a real
response, not just "looks right."

## Dev
- [x] Mint dev token

## Access Requests
- [x] Submit access request (public)
- [x] Approve access request (full Zitadel org/user + NetBird group/invite pipeline confirmed)
- [x] List access requests
- [x] Get access request by id
- [x] Reject access request

## Me
- [x] Get my profile
- [x] Update my avatar
- [x] Get my task stats

## Departments
- [x] List departments
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

## Dashboard
- [x] My dashboard
- [x] Enterprise dashboard

## Audit
- [x] Search audit logs
- [x] Days with audit data
- [x] Export audit logs (CSV)

## Webhooks
- [ ] Zitadel user event (guarded by `X-Webhook-Secret`, not bearer auth)
- [ ] NetBird connection event (guarded by `X-Webhook-Secret`, not bearer auth)
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
