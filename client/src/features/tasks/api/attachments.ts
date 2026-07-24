import { api } from '@/lib/api/client'

/** `storageType` is GOOGLE_DRIVE (prod) or LOCAL (dev); `url` format varies with
 *  it, so treat it as an opaque download/view link (no filename field exists). */
export interface Attachment {
  attachmentId: string
  taskId: string
  projectId: string
  storageType: string
  driveItemId: string | null
  url: string
  uploadedBy: string
  uploadedByName: string | null
  createdAt: string
}

export function getAttachments(taskId: string) {
  return api.get<Attachment[]>(`/tasks/${taskId}/attachments`)
}

export function uploadAttachment(taskId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return api.postForm<Attachment>(`/tasks/${taskId}/attachments`, form)
}

export function deleteAttachment(id: string) {
  return api.del<void>(`/attachments/${id}`)
}
