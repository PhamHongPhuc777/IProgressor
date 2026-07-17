package com.example.server.task.attachment;

import com.example.server.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @GetMapping("/tasks/{taskId}/attachments")
    @PreAuthorize("hasAuthority('task.attachment.upload')")
    public ApiResponse<List<Attachment>> list(@PathVariable("taskId") UUID taskId) {
        return ApiResponse.ok(attachmentService.listByTask(taskId));
    }

    @PostMapping(value = "/tasks/{taskId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('task.attachment.upload')")
    public ResponseEntity<ApiResponse<Attachment>> upload(
        @PathVariable("taskId") UUID taskId, @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(attachmentService.upload(taskId, file)));
    }

    // No @PreAuthorize: the role split here (PM/Admin any file, Staff only their own, Leader never)
    // doesn't map to a single permission key, so it's enforced in AttachmentService.delete().
    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        attachmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
