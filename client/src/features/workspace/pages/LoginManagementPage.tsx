import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApprovalsInbox } from '../components/ApprovalsInbox'
import { NetbirdUsersList } from '../components/NetbirdUsersList'

/** Admin-only. Four sections per UI.md: NetBird-connected, unlock requests,
 *  pending access requests, and offline users -- plus lock/unlock ability. */
export function LoginManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Login Management</h1>
        <p className="text-sm text-muted-foreground">
          Connections, unlock requests, and pending access.
        </p>
      </div>

      <Tabs defaultValue="connected" className="gap-4">
        <TabsList>
          <TabsTrigger value="connected">NetBird Connected</TabsTrigger>
          <TabsTrigger value="unlock">Unlock Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Access</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>

        <TabsContent value="connected">
          <NetbirdUsersList connected />
        </TabsContent>
        <TabsContent value="unlock">
          <ApprovalsInbox typeFilter="unlock" />
        </TabsContent>
        <TabsContent value="pending">
          <ApprovalsInbox typeFilter="new" />
        </TabsContent>
        <TabsContent value="offline">
          <NetbirdUsersList connected={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
