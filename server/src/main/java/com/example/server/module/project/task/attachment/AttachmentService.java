package com.example.server.module.project.task.attachment;

import com.example.server.audit.AuditService;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.integration.storage.DocumentStorageClient;
import com.example.server.integration.storage.StoredFile;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.module.project.task.task.TaskService;
import com.example.server.module.project.task.task.dto.TaskRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentMapper attachmentMapper;
    private final TaskService taskService;
    private final DocumentStorageClient storageClient;
    private final AuditService auditService;

    public List<Attachment> listByTask(UUID taskId) {
        TaskRow row = taskService.requireTask(taskId);
        taskService.requireProjectVisible(row.projectId());
        return attachmentMapper.findByTask(taskId);
    }

    public Attachment upload(UUID taskId, MultipartFile file) {
        TaskRow row = taskService.requireTask(taskId);
        taskService.requireProjectVisible(row.projectId());
        StoredFile stored = storageClient.store(file, "task/" + taskId);
        UUID attachmentId = UUID.randomUUID();
        attachmentMapper.insert(attachmentId, taskId, row.projectId(), stored.storageType(),
            stored.sharepointItemId(), stored.url(), CurrentUser.get().userId());
        auditService.record("UPLOAD_ATTACHMENT", "ATTACHMENT", attachmentId);
        return attachmentMapper.findById(attachmentId);
    }

    /** Per API.md: PM/Admin delete any attachment; Staff only their own upload; Leader never. */
    public void delete(UUID attachmentId) {
        Attachment attachment = requireAttachment(attachmentId);
        AuthenticatedUser actor = CurrentUser.get();
        boolean allowed = actor.hasPermission("task.crud")
            || ("Staff".equals(actor.roleName()) && actor.userId().equals(attachment.uploadedBy()));
        if (!allowed) {
            throw new ForbiddenException("Cannot delete this attachment");
        }
        attachmentMapper.delete(attachmentId);
        auditService.record("DELETE_ATTACHMENT", "ATTACHMENT", attachmentId);
    }

    private Attachment requireAttachment(UUID id) {
        Attachment attachment = attachmentMapper.findById(id);
        if (attachment == null) {
            throw NotFoundException.of("Attachment", id);
        }
        return attachment;
    }
}
