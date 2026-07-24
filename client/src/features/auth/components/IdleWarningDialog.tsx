import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSession } from '../hooks/useSession'

export function IdleWarningDialog({
  open,
  secondsLeft,
  onStayActive,
}: {
  open: boolean
  secondsLeft: number
  onStayActive: () => void
}) {
  const { logout } = useSession()

  return (
    <Dialog open={open}>
      <DialogContent showClose={false}>
        <DialogHeader>
          <DialogTitle>Still there?</DialogTitle>
          <DialogDescription>
            You’ve been idle for a while. You’ll be signed out in {secondsLeft}s.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => logout()}>
            Sign out now
          </Button>
          <Button onClick={onStayActive}>Stay signed in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
