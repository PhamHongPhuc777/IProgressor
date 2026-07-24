import { useAuth } from 'react-oidc-context'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (auth.isLoading) return <FullPageSpinner />
  if (auth.isAuthenticated) return <Navigate to={from} replace />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to IProgressor</CardTitle>
        <CardDescription>Use your company account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button className="w-full" onClick={() => auth.signinRedirect()}>
          Continue with Zitadel
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Need access?{' '}
          <Link to="/register" className="text-foreground underline">
            Request an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
