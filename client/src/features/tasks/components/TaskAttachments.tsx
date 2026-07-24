import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Paperclip, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useMe } from '@/features/workspace'
import {
  deleteAttachment,
  getAttachments,
  uploadAttachment,
} from '../api/attachments'

/** Derive a display label from an opaque storage URL. */
function linkLabel(url: string) {
  try {
    const path = new URL(url, window.location.origin).pathname
    return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? 'attachment')
  } catch {
    return 'attachment'
  }
}

export function TaskAttachments({ taskId }: { taskId: string }) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)

  const allowed = can('task.attachment.upload')
  const attachments = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => getAttachments(taskId),
    enabled: allowed,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['attachments', taskId] })

  const upload = useMutation({
    mutationFn: (file: File) => uploadAttachment(taskId, file),
    onSuccess: () => {
      toast.success('File uploaded.')
      invalidate()
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not upload file.'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: () => {
      toast.success('Attachment removed.')
      invalidate()
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError ? e.message : 'Could not remove attachment.',
      ),
  })

  if (!allowed) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Attachments</h3>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload.mutate(file)
            e.target.value = ''
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => fileInput.current?.click()}
        >
          <Paperclip />
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      {attachments.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : attachments.isError ? (
        <p className="text-sm text-destructive">Couldn’t load attachments.</p>
      ) : attachments.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {attachments.data.map((a) => (
            <li key={a.attachmentId} className="flex items-center gap-2 px-3 py-2">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm underline-offset-2 hover:underline"
              >
                {linkLabel(a.url)}
              </a>
              <span className="text-xs text-muted-foreground">
                {a.uploadedByName ?? '—'}
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Delete attachment"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm('Delete this attachment?'))
                    remove.mutate(a.attachmentId)
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
