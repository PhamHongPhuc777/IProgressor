import { useAuth } from 'react-oidc-context'

/**
 * App-facing view of the Zitadel session. Wraps react-oidc-context so feature
 * code never imports the OIDC lib directly.
 */
export function useSession() {
  const auth = useAuth()
  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    profile: auth.user?.profile,
    login: () => auth.signinRedirect(),
    logout: () => auth.signoutRedirect(),
  }
}
