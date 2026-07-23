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
   - One **Service Account** covering both remaining needs (simplest for local dev -- no need for
     two separate accounts):
     1. **Service Accounts -> New**, give it a username + display name (e.g. `iprogressor-backend`),
        **Create**.
     2. Open its detail page -> **Personal Access Token** section -> **New** -> leave expiration
        blank (or set one) -> copy the token from the dialog immediately, it's shown once. This is
        `ZITADEL_SERVICE_ACCOUNT_TOKEN`, used by `RealZitadelProvisioningClient` to call the
        Management API.
     3. Same detail page -> **Actions** (top right) -> **Generate Client Secret** -> copy both the
        **Client ID** and **Client Secret**, shown once. These are `ZITADEL_DEV_CLIENT_ID` /
        `ZITADEL_DEV_CLIENT_SECRET`, used by `DevTokenController`'s client-credentials convenience
        endpoint.
     4. **Grant it a manager role** -- a PAT alone gets 403 from the Management API without this.
        Go to the organization's detail page -> the **+** button near "Managers" -> **Add a
        Manager** -> pick the service account you just created -> role **Org Owner** -> **Add**.
3. Note the IAM owner's Zitadel user ID -- open **Organization -> Users**, click the bootstrap
   admin user (`admin@iprogressor.local`), and read the ID either from a copy-ID affordance on that
   detail page or straight from the browser's address bar (`.../users/<this-is-the-id>`). This
   becomes `ADMIN_ZITADEL_USER_ID` so `V3__seed_admin_bootstrap.sql` links the bootstrap admin row
   to a real identity. **Without this, the seeded admin cannot log in at all.** (Console labels
   shift between Zitadel versions -- if this doesn't match what you see, send a screenshot.)

   Note the seeded admin's own department is "Administration" (`V3`'s bootstrap department, not
   public-facing -- see `markdown/ENDPOINT.md`'s known-issues list for `V8`, which grants
   `access_request.manage.all_departments` so this Admin can actually approve access requests for
   real departments like IT/Marketing, not just its own).
4. Disable self-registration on the login page. This app's only sanctioned account-creation path is
   access-request approval (`RealZitadelProvisioningClient.createHumanUser`) -- but Zitadel's hosted
   login page ships with self-registration (including "Sign in with Google" creating a brand new
   account, not just linking an existing one) turned on by default. Left on, anyone can authenticate
   as a real Zitadel identity that the app will always 401 on (`LocalUserJwtAuthenticationConverter`
   finds no matching `users` row), and worse, that stray email could later collide with a genuine
   access-request approval for the same address. Turn it off instance-wide:

   ```
   curl -X PUT http://localhost:8081/admin/v1/policies/login \
     -H "Authorization: Bearer $ZITADEL_SERVICE_ACCOUNT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "allowUsernamePassword": true,
       "allowRegister": false,
       "allowExternalIdp": false,
       "forceMfa": false,
       "passwordlessType": "PASSWORDLESS_TYPE_ALLOWED",
       "hidePasswordReset": false,
       "ignoreUnknownUsernames": false,
       "defaultRedirectUri": "",
       "passwordCheckLifetime": "864000s",
       "externalLoginCheckLifetime": "864000s",
       "mfaInitSkipLifetime": "2592000s",
       "secondFactorCheckLifetime": "64800s",
       "multiFactorCheckLifetime": "43200s",
       "allowDomainDiscovery": true,
       "disableLoginWithEmail": false,
       "disableLoginWithPhone": false,
       "forceMfaLocalOnly": false
     }'
   ```

   `PUT /admin/v1/policies/login` replaces the entire policy object (same full-body gotcha as
   NetBird's user `PUT`), so this carries forward the instance's existing values (checked via
   `GET /admin/v1/policies/login` first) and only flips `allowRegister`/`allowExternalIdp` to
   `false`. Confirmed via a real Google sign-in attempt on the login page before and after: the
   external-IDP button no longer creates a new account.
5. Re-enable Google sign-in, but safely -- most employees use Gmail, and `allowExternalIdp` above
   blocks Google login entirely, not just self-registration. The actual account-creation gate lives
   per-IDP, not on the login policy: find the Google IDP's `id` from the login policy response's
   `idps` array (or `GET /admin/v1/idps/google/{id}` isn't valid -- use
   `GET /v2/idps/{id}` instead, the legacy `/admin/v1/idps/{id}` route 404s for Google-typed IDPs),
   then:

   ```
   curl -X PUT http://localhost:8081/admin/v1/idps/google/<idp-id> \
     -H "Authorization: Bearer $ZITADEL_SERVICE_ACCOUNT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Google",
       "clientId": "<existing client id, from a prior GET>",
       "clientSecret": "",
       "scopes": ["openid", "profile", "email"],
       "providerOptions": {
         "isLinkingAllowed": true,
         "isCreationAllowed": false,
         "isAutoCreation": false,
         "isAutoUpdate": false,
         "autoLinking": "AUTO_LINKING_OPTION_EMAIL"
       }
     }'
   ```

   `isCreationAllowed: false` blocks Google from ever creating a new account (closing the same hole
   step 4 closed); `isLinkingAllowed: true` + `autoLinking: AUTO_LINKING_OPTION_EMAIL` lets Google
   sign-in match and prompt-to-link an *existing* account by verified email instead. Leaving
   `clientSecret` empty preserves the existing secret (only overwritten if provided, per
   `UpdateGoogleProviderRequest`'s own field description). Then flip `allowExternalIdp` back to
   `true` in the same login-policy body from step 4 (everything else unchanged) -- safe now that
   creation is blocked at the IDP level regardless of the login policy. Note: the target account's
   Zitadel email must already be *verified* for the auto-link match to trigger, or Google sign-in
   silently falls through to the (blocked) creation path instead of prompting to link.

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

1. Sign up at [netbird.io](https://netbird.io) and log into the dashboard at
   [app.netbird.io](https://app.netbird.io).
2. Go to **Team**, select your own user (or create a dedicated service user for API access), then
   create a **Personal Access Token** there -- this is `NETBIRD_API_TOKEN` below. Set an
   expiration, then copy the token immediately: NetBird only stores a hashed version, so the plain
   value is shown exactly once.
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

## SharePoint / Microsoft Graph

`RealSharePointStorageClient` uploads task attachments to a single shared SharePoint document
library via Microsoft Graph, using an **app-only** (client-credentials) grant -- there's no
signed-in user in this flow, so this is a background-service/daemon app registration in Entra ID,
not a delegated one.

1. In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **App registrations ->
   New registration**. No redirect URI is needed (app-only, no interactive sign-in).
2. Note the **Application (client) ID** and **Directory (tenant) ID** from the app's Overview page
   -- these are `GRAPH_CLIENT_ID` and `GRAPH_TENANT_ID` below.
3. Go to **Certificates & secrets -> New client secret**, then copy the secret **value** (not the
   secret ID) immediately -- like NetBird's PAT, it's only shown once. This is `GRAPH_CLIENT_SECRET`.
4. Go to **API permissions -> Add a permission -> Microsoft Graph -> Application permissions**, add
   `Sites.ReadWrite.All`, then click **Grant admin consent** (application permissions always need
   this, and there's no interactive consent prompt to fall back on since there's no signed-in user).
5. Find the target SharePoint site's hostname and server-relative path from its URL, e.g.
   `https://contoso.sharepoint.com/sites/IProgressor` splits into:
   - `GRAPH_SITE_HOSTNAME` = `contoso.sharepoint.com`
   - `GRAPH_SITE_PATH` = `sites/IProgressor` (no leading slash)

| Variable | Value |
|---|---|
| `GRAPH_TENANT_ID` | Directory (tenant) ID from step 2 |
| `GRAPH_CLIENT_ID` | Application (client) ID from step 2 |
| `GRAPH_CLIENT_SECRET` | the client secret value from step 3 |
| `GRAPH_SITE_HOSTNAME` | the site's hostname from step 5 |
| `GRAPH_SITE_PATH` | the site's server-relative path from step 5 |

`RealSharePointStorageClient` is only active on the `prod` profile -- local dev keeps using
`LocalDocumentStorageClient` (writes to `./uploads`), since this app-only grant isn't worth setting
up just to run locally. It creates any missing folders under the site's document library on its
own (one per task, e.g. `task/{taskId}/`), same as `RealNetBirdClient` creates NetBird groups
on demand -- no folder needs to be created manually.

## Email (SMTP for Zitadel)

Zitadel sends its own verification-code, invite, and password-reset emails -- this app never needs
its own mail sender (no `spring-boot-starter-mail`, no SMTP block in `application.yml`).
`RealZitadelProvisioningClient.createHumanUser` deliberately leaves the new user's password and
email-verification fields unset so Zitadel sends its native "Initialize User" invite (see
`markdown/ENDPOINT.md`'s known-issues list for why an earlier version force-set both instead,
silently suppressing the email). SMTP has to actually work for this, not just for self-service
flows like "forgot password".

**Why Brevo**, over three alternatives considered:
- **Postmark** -- ruled out. Blocks account signup with a personal Gmail/Yahoo address outright
  (their own anti-abuse policy, since sending "from" a domain like gmail.com without Gmail's
  authorization just bounces against DMARC); would've required buying a domain first just to
  create an account.
- **EmailJS** (emailjs.com) -- ruled out. It's a client-side-only REST API (no SMTP server of its
  own); Zitadel needs a real SMTP host/port/credentials, and EmailJS's model would require the
  server-issued verification secret to reach the browser just to email it back out, which is a
  security regression, not just an awkward fit.
- **Mailpit** -- fine for local dev (catches mail in a web UI, confirms the send path fires), but
  never actually delivers anywhere, so it's a dead end for the real employee beta this needs to
  eventually support.
- **Brevo** -- signup accepts a personal email address (no domain gate), free tier (300
  emails/day, no expiration) comfortably covers a beta-sized enterprise headcount, and only
  requires verifying a single sender *address* (click a confirmation link), not a full domain.

**Setup:**
1. Sign up at [brevo.com](https://www.brevo.com) with any email address.
2. Add and verify a sender address: account dropdown -> **Senders, Domains & Dedicated IPs** ->
   **Senders** -> add the address you want emails to come "from" -> click the confirmation link
   Brevo sends to it. This is `BREVO_SENDER_ADDRESS` (`BREVO_SENDER_NAME` is just the display name,
   e.g. "IProgressor").
3. Generate SMTP credentials: account dropdown -> **SMTP & API** -> **SMTP** tab -> **Generate a
   new SMTP key** -- the key is shown once, copy it immediately. `BREVO_SMTP_LOGIN` is your Brevo
   account login email (not the sender address, unless they happen to be the same); `BREVO_SMTP_KEY`
   is the generated key -- your account password does not work here. Set all four in `.env` (see
   `.env.example`).
4. This Zitadel instance is already bootstrapped, so Zitadel's
   `ZITADEL_FIRSTINSTANCE_SMTPCONFIGURATION_*` env vars are a no-op -- they only apply during the
   very first `start-from-init`. Wire it into the already-running instance via the Admin API
   instead, using the service account PAT (`ZITADEL_SERVICE_ACCOUNT_TOKEN`):

   ```
   curl -X POST http://localhost:8081/admin/v1/email/smtp \
     -H "Authorization: Bearer $ZITADEL_SERVICE_ACCOUNT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "senderAddress": "'"$BREVO_SENDER_ADDRESS"'",
       "senderName": "'"$BREVO_SENDER_NAME"'",
       "tls": true,
       "host": "smtp-relay.brevo.com:587",
       "user": "'"$BREVO_SMTP_LOGIN"'",
       "plain": {
         "password": "'"$BREVO_SMTP_KEY"'"
       }
     }'
   ```

   Note: `senderAddress`/`senderName`/`host`/`user`/`tls` are top-level fields on
   `AddEmailProviderSMTPRequest` -- only `password` goes inside `plain` (confirmed against the
   real `admin.proto` on GitHub; Zitadel's own rendered docs page shows every field nested under
   `plain`/`none`/`xoauth2`, which is wrong and produces a
   `"value length must be between 1 and 200 runes"` error on `senderAddress` since it silently
   lands nowhere).

   Copy the `id` from the response, then activate it (Zitadel only sends through whichever
   provider is active):

   ```
   curl -X POST http://localhost:8081/admin/v1/email/<id-from-above>/_activate \
     -H "Authorization: Bearer $ZITADEL_SERVICE_ACCOUNT_TOKEN"
   ```
5. Confirm by triggering any Zitadel-sent email and checking it actually arrives at the
   sender-verified address.

**Confirmed working end-to-end** (2026-07-22): `http://localhost:8081/ui/v2/login/login` can't be
browsed to directly (needs a live `authRequest` from an actual OIDC flow), so triggered via the v2
API instead: `POST /v2/users/{userId}/password_reset` with an empty `{}` body (instance-wide, no
org-header issue unlike the deprecated org-scoped `management/v1/users/{id}/password/_reset`,
which 404s a user provisioned into a non-default org without an `x-zitadel-orgid` header). Both
the "Reset password" email and the automatic "Password of user has changed" follow-up notification
landed in the primary inbox (not spam), correctly branded with the `senderName` set above.

**Don't set `BREVO_SENDER_ADDRESS` to the same address you're testing delivery to** (discovered the
hard way): the very first password-reset test above worked because `BREVO_SENDER_ADDRESS` happened
to be the tester's own personal Gmail address, but a later `POST /v2/users/{userId}/email/send`
verification-code test to that *same* address silently vanished (no bounce, not in spam) despite
Zitadel logging a clean send and Brevo's own delivery log showing `Sent`/`First opening`. Root
cause: sending "From: yourname@gmail.com" via Brevo's servers (not Google's) fails SPF/DKIM
alignment for `gmail.com` -- `gmail.com`'s own DMARC record is lenient (`p=none`, checked via
`dig TXT _dmarc.gmail.com`), so it isn't hard-rejected, but Gmail's *heuristic* spam classifier
treats "claims to be a gmail.com address, arrives via non-Google infra" as a classic
self-impersonation/phishing signal and got more aggressive about silently dropping it the more of
that exact pattern it saw in one day. Any other free-provider sender (Outlook, etc.) has the same
underlying SPF/DKIM misalignment, just without the specific "impersonating the recipient's own
provider" pattern -- still not reliable, since free-provider senders can also get flagged by
Brevo/the recipient independently (e.g. a brand-new Outlook.com mailbox not receiving Brevo's own
sender-verification code, even in Junk).

**Real fix: authenticate your own domain in Brevo**, not a free-provider address at all. Buy a
cheap domain (e.g. Cloudflare Registrar, ~$1-12/yr) -- this project uses `all-rounder.win` -- then
in Brevo: **Senders, Domains & Dedicated IPs -> Domains -> Add a domain -> Manual** setup (not
"Automatic", which would require granting Brevo direct API/OAuth write access to your DNS zone).
Brevo gives you 7 DNS records to add (1 domain-ownership TXT, 2 DKIM CNAMEs, 1 DMARC TXT, and 3
CNAMEs for branded links/images). **If your DNS host is Cloudflare, every CNAME must be set to
"DNS only" (grey cloud), not "Proxied" (orange cloud)** -- Cloudflare defaults new CNAMEs to
Proxied, which routes through Cloudflare's edge IPs instead of Brevo's actual mail infrastructure
and silently breaks DKIM/domain verification even though the record technically "exists". Once
Brevo shows the domain as `Authenticated` (a separate `Branding status` of "Not branded" is fine to
ignore -- that only affects click/open-tracking link cosmetics, which this SMTP-relay setup doesn't
use), any address `@yourdomain` can be used as `BREVO_SENDER_ADDRESS` without per-address
click-to-verify. Apply the change to the already-running Zitadel instance via
`UpdateEmailProviderSMTP`, **not** `UpdateSMTPConfig`/`/admin/v1/email/{id}` (that's a different,
deprecated API group under the same Admin API and returns `405 Method Not Allowed`):

```
curl -X PUT http://localhost:8081/admin/v1/email/smtp/<id-from-GET-/admin/v1/email> \
  -H "Authorization: Bearer $ZITADEL_SERVICE_ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderAddress": "'"$BREVO_SENDER_ADDRESS"'",
    "senderName": "'"$BREVO_SENDER_NAME"'",
    "tls": true,
    "host": "smtp-relay.brevo.com:587",
    "user": "'"$BREVO_SMTP_LOGIN"'"
  }'
```

This updates and re-activates the existing config in one call (per the RPC's own description: "be
aware that this will be activated as soon as it is saved"), unlike the initial `AddEmailProviderSMTP`
+ `_activate` two-step above. Confirmed working end-to-end after switching to
`noreply@all-rounder.win`: a fresh verification-code email landed in the same Gmail inbox that had
just silently dropped the self-sent-from-gmail.com version minutes earlier.
