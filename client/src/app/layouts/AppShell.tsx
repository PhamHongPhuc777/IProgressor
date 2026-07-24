import { NavLink, Outlet } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ScrollText,
  LogOut,
  BarChart3,
  Gauge,
  TrendingUp,
  KeyRound,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { UserSummaryCard } from '@/components/common/UserSummaryCard'
import { useSession } from '@/features/auth/hooks/useSession'
import { useMe } from '@/features/workspace'
import { NotificationsBell, useNotificationStream } from '@/features/notifications'
import { BroadcastButton } from '@/components/common/BroadcastButton'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const COMMON: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/workspace', label: 'Members', icon: Users },
]

// Left-nav tabs are role-specific per UI.md (Notifications is deliberately
// excluded — it's a header bell, not a Tab).
function navFor(roleName: string): NavItem[] {
  switch (roleName.toLowerCase()) {
    case 'pm':
      return [...COMMON, { to: '/resource-allocation', label: 'Resource Allocation', icon: Gauge }]
    case 'leader':
      return [
        ...COMMON,
        { to: '/performance-risk', label: 'Performance & Risk', icon: TrendingUp },
      ]
    case 'admin':
      return [
        ...COMMON,
        { to: '/login-management', label: 'Login Management', icon: KeyRound },
        { to: '/access-control-matrix', label: 'Access Control Matrix', icon: Shield },
        { to: '/audit', label: 'Audit Logs', icon: ScrollText },
      ]
    case 'staff':
    default:
      return [...COMMON, { to: '/statistics', label: 'Statistics', icon: BarChart3 }]
  }
}

export function AppShell() {
  const { can, me } = useMe()
  const { logout } = useSession()
  useNotificationStream(can('notification.receive_realtime'))

  const nav = navFor(me?.roleName ?? '')

  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-r bg-sidebar p-3">
        <div className="px-2 py-3 text-lg font-semibold">IProgressor</div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <UserSummaryCard />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b px-6">
          {can('broadcast_message.send') && <BroadcastButton />}
          <ThemeToggle />
          <NotificationsBell />
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => logout()}>
            <LogOut />
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
