import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import { getDepartments, useMe } from '@/features/workspace'
import { broadcast } from '@/features/notifications/api/notifications'

/** Header quick-composer (broadcast_message.send): Leader is locked to their
 *  own department, Admin can target any -- per UI.md's "next to the
 *  Notification Icon" placement. */
export function BroadcastButton() {
  const { user, isRole } = useMe()
  const isLeader = isRole('leader')
  const [open, setOpen] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [content, setContent] = useState('')

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: open && !isLeader,
    staleTime: 5 * 60 * 1000,
  })

  const effectiveDepartmentId = isLeader ? (user?.departmentId ?? '') : departmentId

  const send = useMutation({
    mutationFn: () => broadcast(effectiveDepartmentId, content.trim()),
    onSuccess: () => {
      toast.success('Broadcast sent.')
      setContent('')
      setOpen(false)
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not send broadcast.'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Send broadcast">
            <Megaphone />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a broadcast</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (effectiveDepartmentId && content.trim()) send.mutate()
          }}
        >
          {!isLeader && (
            <div className="grid gap-2">
              <Label htmlFor="broadcast-dept">Department</Label>
              <NativeSelect
                id="broadcast-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={departments.isPending}
              >
                <option value="" disabled>
                  {departments.isPending ? 'Loading…' : 'Select a department'}
                </option>
                {departments.data?.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="broadcast-content">Message</Label>
            <Textarea
              id="broadcast-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={send.isPending || !effectiveDepartmentId || !content.trim()}
            >
              {send.isPending ? 'Sending…' : 'Send broadcast'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
