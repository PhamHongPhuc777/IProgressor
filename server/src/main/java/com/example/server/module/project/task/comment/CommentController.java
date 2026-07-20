package com.example.server.task.comment;

import com.example.server.common.ApiResponse;
import com.example.server.task.comment.dto.CreateCommentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @PreAuthorize("hasAuthority('task.comment.create')")
    public ApiResponse<List<Comment>> list(@PathVariable("taskId") UUID taskId) {
        return ApiResponse.ok(commentService.listByTask(taskId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('task.comment.create')")
    public ResponseEntity<ApiResponse<Comment>> create(
        @PathVariable("taskId") UUID taskId, @Valid @RequestBody CreateCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(commentService.create(taskId, request)));
    }
}
