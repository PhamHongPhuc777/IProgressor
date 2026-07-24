import { Link, Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'

/** Centered container for the public auth pages (login, register, callback). */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Link
        to="/home"
        className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-foreground"
      >
        ← IProgressor
      </Link>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
