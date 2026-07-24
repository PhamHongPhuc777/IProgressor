import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import { useMe } from '@/features/workspace'
import { createComment, getComments } from '../api/comments'

export function TaskComments({ taskId }: { taskId: string }) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const allowed = can('task.comment.create')
  const comments = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => getComments(taskId),
    enabled: allowed,
  })

  const add = useMutation({
    mutationFn: () => createComment(taskId, content.trim()),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not post comment.'),
  })

  if (!allowed) return null

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Comments</h3>

      {comments.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : comments.isError ? (
        <p className="text-sm text-destructive">Couldn’t load comments.</p>
      ) : comments.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.data.map((c) => (
            <li key={c.commentId} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (content.trim()) add.mutate()
        }}
      >
        <Textarea
          placeholder="Add a comment…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          className="self-end"
          disabled={add.isPending || !content.trim()}
        >
          {add.isPending ? 'Posting…' : 'Comment'}
        </Button>
      </form>
    </div>
  )
}
