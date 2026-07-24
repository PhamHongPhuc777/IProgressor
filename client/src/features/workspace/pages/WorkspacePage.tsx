import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MembersTable } from '../components/MembersTable'
import { PermissionMatrix } from '../components/PermissionMatrix'
import { ApprovalsInbox } from '../components/ApprovalsInbox'
import { useMe } from '../hooks/useMe'

export function WorkspacePage() {
  const { can } = useMe()
  const canMatrix = can('authority_matrix.manage')
  const canApprovals = can('access_request.manage')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Members, roles and permissions.
        </p>
      </div>

      <Tabs defaultValue="members" className="gap-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          {canApprovals && (
            <TabsTrigger value="requests">Access Requests</TabsTrigger>
          )}
          {canMatrix && (
            <TabsTrigger value="permissions">Roles &amp; Permissions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          <MembersTable />
        </TabsContent>
        {canApprovals && (
          <TabsContent value="requests">
            <ApprovalsInbox />
          </TabsContent>
        )}
        {canMatrix && (
          <TabsContent value="permissions">
            <PermissionMatrix />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
