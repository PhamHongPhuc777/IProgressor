import { useSession } from '@/features/auth/hooks/useSession'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const placeholders = [
  { title: 'Active projects', hint: 'Across your departments' },
  { title: 'Tasks due this week', hint: 'Assigned to you' },
  { title: 'At-risk milestones', hint: 'Behind schedule' },
]

export function DashboardPage() {
  const { profile } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome{profile?.name ? `, ${profile.name}` : ''}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholders.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.hint}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
