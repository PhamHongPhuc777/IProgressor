package com.example.server.task.comment;

import com.example.server.audit.AuditService;
import com.example.server.security.CurrentUser;
import com.example.server.task.comment.dto.CreateCommentRequest;
import com.example.server.task.task.TaskService;
import com.example.server.task.task.dto.TaskRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final TaskService taskService;
    private final AuditService auditService;

    public List<Comment> listByTask(UUID taskId) {
        TaskRow row = taskService.requireTask(taskId);
        taskService.requireProjectVisible(row.projectId());
        return commentMapper.findByTask(taskId);
    }

    public Comment create(UUID taskId, CreateCommentRequest request) {
        TaskRow row = taskService.requireTask(taskId);
        taskService.requireProjectVisible(row.projectId());
        UUID commentId = UUID.randomUUID();
        commentMapper.insert(commentId, taskId, CurrentUser.get().userId(), request.content());
        auditService.record("CREATE_COMMENT", "COMMENT", commentId);
        return commentMapper.findById(commentId);
    }
}
