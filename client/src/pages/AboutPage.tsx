import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  {
    title: '1. Request access',
    description:
      'Anyone can submit a request with their name, email, and department — no account needed yet.',
  },
  {
    title: '2. An admin reviews it',
    description:
      'A department lead or admin approves or rejects the request from their workspace.',
  },
  {
    title: '3. Your account is provisioned',
    description:
      'On approval, your identity and network access are set up automatically, and you’ll get an email to set your password.',
  },
]

export function AboutPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">About IProgressor</h1>
        <p className="text-muted-foreground">
          IProgressor is an internal project management platform: projects, milestones,
          and tasks for staff and project managers, cross-department visibility for
          leads, and full administrative control for admins — all scoped to what each
          role actually needs to see.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">How access works</h2>
        <div className="flex flex-col gap-3">
          {steps.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground">Already have access, or ready to request it?</p>
        <div className="flex gap-3">
          <Button render={<Link to="/login">Sign in</Link>} />
          <Button variant="outline" render={<Link to="/register">Request access</Link>} />
        </div>
      </section>
    </div>
  )
}
