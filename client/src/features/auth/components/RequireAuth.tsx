import type { ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

/** Gate for protected routes: waits on the session, then requires a login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isLoading) return <FullPageSpinner label="Loading…" />

  if (auth.error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-sm text-destructive">
          Authentication error: {auth.error.message}
        </p>
        <Button onClick={() => auth.signinRedirect()}>Try again</Button>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
