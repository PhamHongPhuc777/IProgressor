import { z } from 'zod'

// Validated once at startup so a missing/malformed var fails loud and early
// instead of surfacing as a confusing runtime error deep in the auth flow.
const schema = z.object({
  VITE_ZITADEL_AUTHORITY: z.url(),
  VITE_ZITADEL_CLIENT_ID: z.string().min(1),
  VITE_API_BASE_URL: z.url(),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error(
    'Invalid environment configuration:',
    z.flattenError(parsed.error).fieldErrors,
  )
  throw new Error('Invalid environment configuration — check your .env.local')
}

export const env = {
  ZITADEL_AUTHORITY: parsed.data.VITE_ZITADEL_AUTHORITY,
  ZITADEL_CLIENT_ID: parsed.data.VITE_ZITADEL_CLIENT_ID,
  API_BASE_URL: parsed.data.VITE_API_BASE_URL.replace(/\/$/, ''),
} as const
