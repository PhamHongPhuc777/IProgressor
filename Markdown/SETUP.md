# Local dev setup: Zitadel

The server now validates real Zitadel-issued JWTs in both `dev` and `prod` profiles (no more
HS256 stub). This is the one-time setup to get a local Zitadel instance running and wired up.

## 1. Bring up Zitadel

```
cp .env.example .env
docker compose up -d
```

Wait for all four `zitadel-*` containers to report healthy (`docker compose ps`). Zitadel is then
reachable at `http://localhost:8081` (remapped from its own default of 8080, which collides with
Spring Boot's default port).

The app's own Postgres is **not** part of this compose file -- it uses whatever native Postgres is
already running on this machine (see `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` below).

## 2. First-instance bootstrap (one-time, per fresh `docker compose up`)

1. Open `http://localhost:8081/ui/v2/login/login` and complete Zitadel's first-instance setup as
   the IAM owner. Use a fake local address, not a real personal email -- e.g.
   `admin@iprogressor.local` (matches this project's `ADMIN_EMAIL` default) -- and mark the email
   verified during setup so no real inbox is needed.
2. In the Zitadel console, create a **Project** (e.g. "IProgressor"), then:
   - A **User Agent (SPA/PKCE)** application for the React client, redirect URI
     `http://localhost:5173/auth/callback`, post-logout `http://localhost:5173`, Dev Mode enabled.
   - A **Service User** (Users -> Service Users -> New) with a **Personal Access Token** -- this is
     `ZITADEL_SERVICE_ACCOUNT_TOKEN` below, used by `RealZitadelProvisioningClient` to call the
     Management API. Grant it an org-admin-level role.
   - A second **Service User + client credentials** (or reuse the one above) for
     `DevTokenController`'s convenience endpoint -- `ZITADEL_DEV_CLIENT_ID`/`ZITADEL_DEV_CLIENT_SECRET`.
3. Note the IAM owner's Zitadel user ID (visible in the console) -- this becomes
   `ADMIN_ZITADEL_USER_ID` so `V3__seed_admin_bootstrap.sql` links the bootstrap admin row to a
   real identity. **Without this, the seeded admin cannot log in at all.**

## 3. Environment variables

| Variable | Value |
|---|---|
| `ZITADEL_ISSUER_URI` | `http://localhost:8081` |
| `ZITADEL_SERVICE_ACCOUNT_TOKEN` | the PAT from step 2 |
| `ZITADEL_DEV_CLIENT_ID` / `ZITADEL_DEV_CLIENT_SECRET` | dev machine user credentials from step 2 |
| `ADMIN_ZITADEL_USER_ID` | the IAM owner's user ID from step 2 |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | your existing native Postgres, NOT containerized here |

## 4. Minting a dev token without a browser

```
curl -X POST http://localhost:8080/api/v1/dev/token
```

Returns a real Zitadel-issued access token for the dev machine user (client-credentials grant).
Note this authenticates as that machine identity -- exercising a specific human role still
requires either a real browser login, or provisioning the machine identity's `zitadel_user_id` as
a local `users` row with the desired role.

## NetBird

Using NetBird Cloud (`https://api.netbird.io`), not self-hosted -- self-hosted NetBird's own
quickstart requires a public domain + Let's Encrypt TLS, which doesn't fit a pure local-dev setup.
`RealNetBirdClient` matches NetBird users by **email**, not Zitadel identity: NetBird Cloud (a
remote service) can't reach a local self-hosted Zitadel instance to do OIDC discovery, so
`idp_id`-based SSO linkage isn't viable here.

1. Sign up at [netbird.io](https://netbird.io) and log into the dashboard.
2. Go to **Users -> Me**, create a **Personal Access Token** -- this is `NETBIRD_API_TOKEN` below.
3. That's it for setup -- `RealNetBirdClient` creates NetBird groups (one per department) and
   invites/syncs users on its own via the API when access requests are approved or a user is
   locked/unlocked. No group needs to be created manually.

| Variable | Value |
|---|---|
| `NETBIRD_API_BASE_URL` | `https://api.netbird.io` (default, only change for self-hosted) |
| `NETBIRD_API_TOKEN` | the PAT from step 2 |

Inbound webhook signature verification (NetBird pushing connection events back to this app) is
still deferred -- NetBird's own docs were unclear on whether the self-hosted OSS edition's event
streaming feature applies to Cloud the same way, so `webhook/dto/NetbirdConnectionEventPayload`'s
shape is still provisional. Revisit once that's confirmed against a real webhook payload.
