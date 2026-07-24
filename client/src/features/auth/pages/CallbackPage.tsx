import { useAuth } from 'react-oidc-context'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

/**
 * Zitadel redirects here after login. AuthProvider processes the PKCE code
 * exchange automatically; this page just reflects that in-flight state.
 */
export function CallbackPage() {
  const auth = useAuth()

  if (auth.isLoading) return <FullPageSpinner label="Signing you in…" />

  if (auth.error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-destructive">
          Sign-in failed: {auth.error.message}
        </p>
        <Button onClick={() => auth.signinRedirect()}>Try again</Button>
      </div>
    )
  }

  return <Navigate to="/" replace />
}
