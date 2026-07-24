import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSession } from '@/features/auth/hooks/useSession'

const COUNTDOWN_SECONDS = 10

/**
 * Shown when the current user's role was just changed by an Admin. The
 * server re-resolves permissions from the DB on every request already, so
 * this isn't a security fix -- it's forcing the client's cached nav/UI state
 * (react-oidc-context session, useMe's 5-minute staleTime) back in sync
 * immediately instead of leaving it stale until the user happens to refresh.
 * Deliberately not dismissible except by logging in again right away.
 */
export function ForceLogoutDialog({ open }: { open: boolean }) {
  const { logout } = useSession()
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    if (!open) return
    setSecondsLeft(COUNTDOWN_SECONDS)
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [open])

  useEffect(() => {
    if (open && secondsLeft === 0) logout()
  }, [open, secondsLeft, logout])

  return (
    <Dialog open={open}>
      <DialogContent showClose={false}>
        <DialogHeader>
          <DialogTitle>Your role has changed</DialogTitle>
          <DialogDescription>
            An admin updated your role. You’ll be signed out in {secondsLeft}s so your
            session picks up the change — please log in again afterward.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => logout()}>Log out now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
