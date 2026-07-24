import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bell,
  Users,
  ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { UserMenu } from '@/features/auth/components/UserMenu'

// `ready: false` items render as disabled placeholders until their feature
// slice ships a route — the structure is visible without dead links.
const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, ready: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, ready: true },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, ready: false },
  { to: '/notifications', label: 'Notifications', icon: Bell, ready: false },
  { to: '/workspace', label: 'Workspace', icon: Users, ready: true },
  { to: '/audit', label: 'Audit', icon: ScrollText, ready: false },
] as const

export function AppShell() {
  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-1 border-r bg-sidebar p-3">
        <div className="px-2 py-3 text-lg font-semibold">IProgressor</div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, ready, ...rest }) =>
            ready ? (
              <NavLink
                key={to}
                to={to}
                end={'end' in rest ? rest.end : undefined}
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
            ) : (
              <span
                key={to}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground/50"
              >
                <Icon className="size-4" />
                {label}
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wide">
                  soon
                </span>
              </span>
            ),
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b px-6">
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
