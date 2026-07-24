/** Format a server LocalDate ('YYYY-MM-DD') for display. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '—'
  if (start && end) return `${formatDate(start)} → ${formatDate(end)}`
  if (start) return `from ${formatDate(start)}`
  return `until ${formatDate(end)}`
}
