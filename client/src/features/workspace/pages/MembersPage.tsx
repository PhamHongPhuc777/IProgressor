import { MembersTable } from '../components/MembersTable'

/** All roles. Own-department for Staff/PM, cross-department (with a filter) for Leader/Admin —
 *  MembersTable itself adapts based on enterprise.members.view. */
export function MembersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-sm text-muted-foreground">People in your workspace.</p>
      </div>
      <MembersTable />
    </div>
  )
}
