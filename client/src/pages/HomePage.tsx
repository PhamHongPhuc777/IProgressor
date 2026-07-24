import { Link } from 'react-router-dom'
import { FolderKanban, Users, Bell, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: FolderKanban,
    title: 'Projects & tasks',
    description: 'Kanban, list, calendar, and Gantt views over the same shared data.',
  },
  {
    icon: Users,
    title: 'Team workspace',
    description: 'Members, roles, and departments, scoped to who should see what.',
  },
  {
    icon: Bell,
    title: 'Real-time notifications',
    description: 'Stay on top of approvals, broadcasts, and role changes as they happen.',
  },
  {
    icon: ScrollText,
    title: 'Audit & compliance',
    description: 'Every action logged, exportable, and always available to review.',
  },
]

export function HomePage() {
  return (
    <div className="flex flex-col gap-16 px-6 py-16">
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Project management for your whole organization
        </h1>
        <p className="text-lg text-muted-foreground">
          IProgressor brings projects, tasks, and teams into one place — with the
          visibility your leadership needs and the focus your staff want.
        </p>
        <div className="flex gap-3">
          <Button size="lg" render={<Link to="/login">Sign in</Link>} />
          <Button size="lg" variant="outline" render={<Link to="/register">Request access</Link>} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="size-5 text-muted-foreground" />
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  )
}
