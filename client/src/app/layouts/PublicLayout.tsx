import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'

/** Full-width layout for the public marketing pages (Home, About) — distinct
 *  from AuthLayout's narrow centered card, which is built for the login/
 *  register forms specifically. */
export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link to="/home" className="text-lg font-semibold">
          IProgressor
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/home" className="hover:text-foreground">
            Home
          </Link>
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" variant="outline" render={<Link to="/login">Sign in</Link>} />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} IProgressor.
      </footer>
    </div>
  )
}
