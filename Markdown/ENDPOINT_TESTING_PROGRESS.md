# Endpoint testing progress

Tracking manual Postman verification against the real Zitadel + NetBird + Supabase stack (see
`postman/IProgressor.postman_collection.json`). Check off as each request is confirmed with a real
response, not just "looks right."

## Dev
- [x] Mint dev token

## Access Requests
- [x] Submit access request (public)
- [x] Approve access request (full Zitadel org/user + NetBird group/invite pipeline confirmed)
- [ ] List access requests
- [ ] Get access request by id
- [ ] Reject access request

## Me
- [x] Get my profile
- [ ] Update my avatar
- [ ] Get my task stats

## Departments
- [x] List departments
- [ ] List department members
- [ ] Resource allocation
- [ ] Performance risk

## Projects
- [x] Search projects
- [x] Get project by id
- [x] Create project
- [x] Update project
- [x] Archive project (204, confirmed soft-delete via status column, not a real DELETE)

## Milestones
- [x] Create milestone
- [ ] List milestones for project
- [ ] Update milestone
- [ ] Delete milestone

## Tasks
- [x] Create task
- [x] Add tag to task
- [x] Remove tag from task (confirmed catalog `tag` row is untouched by design -- only `task_tag` join row is deleted)
- [ ] List tasks for project
- [ ] Get task by id
- [ ] Update task
- [ ] Update task status
- [ ] Delete task

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
- [ ] Stream notifications (SSE)
- [ ] Mark notification read
- [ ] Send broadcast

## Users
- [ ] List users (company-wide)
- [ ] Get user by id
- [ ] Change user role
- [ ] Lock user
- [ ] Unlock user
- [ ] Get user NetBird status

## Roles
- [ ] List roles
- [ ] List permissions
- [ ] Get role permissions
- [ ] Update role permissions

## Dashboard
- [ ] My dashboard
- [ ] Enterprise dashboard

## Audit
- [ ] Search audit logs
- [ ] Days with audit data
- [ ] Export audit logs (CSV)

## Webhooks
- [ ] Zitadel user event (guarded by `X-Webhook-Secret`, not bearer auth)
- [ ] NetBird connection event (guarded by `X-Webhook-Secret`, not bearer auth)

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
