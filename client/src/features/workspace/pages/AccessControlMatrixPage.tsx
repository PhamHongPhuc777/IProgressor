import { PermissionMatrix } from '../components/PermissionMatrix'

/** Admin-only standalone tab (authority_matrix.manage). */
export function AccessControlMatrixPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Access Control Matrix</h1>
        <p className="text-sm text-muted-foreground">
          Toggle which permissions each role has.
        </p>
      </div>
      <PermissionMatrix />
    </div>
  )
}
