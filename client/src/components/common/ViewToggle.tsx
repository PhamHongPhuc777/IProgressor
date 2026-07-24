import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon: LucideIcon }[]
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-0.5 rounded-lg border p-0.5', className)}>
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="icon-sm"
          variant={value === opt.value ? 'default' : 'ghost'}
          aria-label={opt.label}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          <opt.icon />
        </Button>
      ))}
    </div>
  )
}
