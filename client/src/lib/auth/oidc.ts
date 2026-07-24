import {
  UserManager,
  WebStorageStateStore,
  type UserManagerSettings,
} from 'oidc-client-ts'
import { env } from '@/config/env'

// Zitadel Authorization Code + PKCE (ROPC is removed server-side, so the
// browser redirect flow is the only supported path). `response_type: 'code'`
// makes oidc-client-ts use PKCE automatically.
export const oidcConfig: UserManagerSettings = {
  authority: env.ZITADEL_AUTHORITY,
  client_id: env.ZITADEL_CLIENT_ID,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email offline_access',
  // Persist across reloads; offline_access + automaticSilentRenew keep the
  // session alive without re-prompting.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
}

// Single shared instance so non-React code (the API client) can read the
// current access token via `userManager.getUser()`.
export const userManager = new UserManager(oidcConfig)

// Strip the `?code=...&state=...` params from the URL after a successful login
// so a refresh of /auth/callback doesn't try to replay the exchange.
export function onSigninCallback(): void {
  window.history.replaceState({}, document.title, window.location.pathname)
}
