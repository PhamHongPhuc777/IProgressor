import { api } from '@/lib/api/client'

export interface Comment {
  commentId: string
  taskId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export function getComments(taskId: string) {
  return api.get<Comment[]>(`/tasks/${taskId}/comments`)
}

export function createComment(taskId: string, content: string) {
  return api.post<Comment>(`/tasks/${taskId}/comments`, { content })
}
