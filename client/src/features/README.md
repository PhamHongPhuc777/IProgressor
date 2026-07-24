# Features

Each folder here is a **feature slice** that mirrors a backend (Spring Modulith)
module. A slice is self-contained — everything a feature needs lives together,
so a change to "projects" touches one folder instead of four sibling trees.

## Slice layout

```
features/<name>/
├── api/          # HTTP calls for this module (uses @/lib/api/client)
├── components/   # feature-specific components
├── hooks/        # feature-specific hooks (incl. useQuery/useMutation wrappers)
├── pages/        # route-level screens
├── stores/       # feature-scoped Zustand stores (optional)
├── types.ts      # feature-local types
└── index.ts      # public surface — import from here, not deep paths
```

Not every slice needs every folder. Add them as the feature grows.

## Slices (→ backend modules)

| Slice             | Backend module / API area                          | Status      |
| ----------------- | -------------------------------------------------- | ----------- |
| `auth`            | `auth` — Zitadel PKCE session, guards              | built       |
| `access-requests` | `workspace` — public onboarding (`/access-requests`) | built (stub) |
| `dashboard`       | `dashboard` — aggregate overview                   | built (stub) |
| `workspace`       | departments, users, roles & permission matrix      | placeholder |
| `projects`        | `project`                                          | placeholder |
| `milestones`      | `milestone`                                        | placeholder |
| `tasks`           | `task` (+ comments & attachments)                  | placeholder |
| `notifications`   | `notification` (SSE)                               | placeholder |
| `audit`           | `audit`                                            | placeholder |

## Conventions

- **Server state** → TanStack Query (`useQuery`/`useMutation`). **Client/UI state**
  → Zustand (`@/stores` for global, `features/*/stores` for scoped).
- **Forms** → React Hook Form + Zod via `@hookform/resolvers/zod`.
- Import across slices through the slice's `index.ts` barrel, not deep paths.
