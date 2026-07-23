package com.example.server.module.project.task.comment;

import com.example.server.module.audit.AuditService;
import com.example.server.common.exception.ForbiddenException;
import com.example.server.common.exception.NotFoundException;
import com.example.server.security.CurrentUser;
import com.example.server.module.project.task.comment.dto.CreateCommentRequest;
import com.example.server.module.project.task.comment.dto.UpdateCommentRequest;
import com.example.server.module.project.task.task.TaskService;
import com.example.server.module.project.task.task.dto.TaskRow;
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

    /** Author-only: fixing a typo or an unwanted comment, not general moderation. */
    public Comment update(UUID taskId, UUID commentId, UpdateCommentRequest request) {
        Comment comment = requireOwnComment(taskId, commentId);
        commentMapper.update(commentId, request.content());
        auditService.record("UPDATE_COMMENT", "COMMENT", commentId);
        return commentMapper.findById(comment.commentId());
    }

    /** Author-only, same as update() -- not a moderation tool for other users' comments. */
    public void delete(UUID taskId, UUID commentId) {
        requireOwnComment(taskId, commentId);
        commentMapper.delete(commentId);
        auditService.record("DELETE_COMMENT", "COMMENT", commentId);
    }

    private Comment requireOwnComment(UUID taskId, UUID commentId) {
        TaskRow row = taskService.requireTask(taskId);
        taskService.requireProjectVisible(row.projectId());
        Comment comment = commentMapper.findById(commentId);
        if (comment == null || !comment.taskId().equals(taskId)) {
            throw NotFoundException.of("Comment", commentId);
        }
        if (!comment.authorId().equals(CurrentUser.get().userId())) {
            throw new ForbiddenException("Cannot edit or delete another user's comment");
        }
        return comment;
    }
}
