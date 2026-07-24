import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '../hooks/useSession'

export function UserMenu() {
  const { profile, logout } = useSession()
  const name =
    profile?.name ?? profile?.preferred_username ?? profile?.email ?? 'Account'

  return (
    <div className="flex items-center gap-3">
      <span className="max-w-40 truncate text-sm text-muted-foreground">
        {name}
      </span>
      <Button variant="ghost" size="sm" onClick={() => logout()}>
        <LogOut />
        Sign out
      </Button>
    </div>
  )
}
