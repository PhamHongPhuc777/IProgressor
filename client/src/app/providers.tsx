import type { ReactNode } from 'react'
import { AuthProvider } from 'react-oidc-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { userManager, onSigninCallback } from '@/lib/auth/oidc'
import { queryClient } from './query-client'

/** App-wide providers, outermost first: auth → server-state → toasts. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}
