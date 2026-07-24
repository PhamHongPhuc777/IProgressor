import { Badge } from '@/components/ui/badge'

const VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PLANNING: 'outline',
  ACTIVE: 'default',
  ON_HOLD: 'secondary',
  COMPLETED: 'secondary',
  ARCHIVED: 'destructive',
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const variant = VARIANT[status.toUpperCase()] ?? 'outline'
  return <Badge variant={variant}>{status.toLowerCase().replace(/_/g, ' ')}</Badge>
}
