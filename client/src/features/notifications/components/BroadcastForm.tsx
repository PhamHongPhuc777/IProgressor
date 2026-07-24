import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import { getDepartments } from '@/features/workspace'
import { broadcast } from '../api/notifications'

/** Leader/Admin composer (broadcast_message.send) → fans out as notifications. */
export function BroadcastForm() {
  const [departmentId, setDepartmentId] = useState('')
  const [content, setContent] = useState('')

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
  })

  const send = useMutation({
    mutationFn: () => broadcast(departmentId, content.trim()),
    onSuccess: () => {
      toast.success('Broadcast sent.')
      setContent('')
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not send broadcast.'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a broadcast</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (departmentId && content.trim()) send.mutate()
          }}
        >
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
          <div className="grid gap-2">
            <Label htmlFor="broadcast-content">Message</Label>
            <Textarea
              id="broadcast-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="self-end"
            disabled={send.isPending || !departmentId || !content.trim()}
          >
            {send.isPending ? 'Sending…' : 'Send broadcast'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
