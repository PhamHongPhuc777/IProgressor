package com.example.server.notification.notification;

import com.example.server.common.ApiResponse;
import com.example.server.common.PageRequest;
import com.example.server.common.PageResponse;
import com.example.server.notification.broadcast.BroadcastMessage;
import com.example.server.notification.broadcast.BroadcastService;
import com.example.server.notification.broadcast.dto.BroadcastRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final BroadcastService broadcastService;

    @GetMapping
    public ApiResponse<PageResponse<Notification>> list(
        @RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.ok(notificationService.list(PageRequest.of(page, size, null)));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAuthority('notification.receive_realtime')")
    public SseEmitter stream() {
        return notificationService.stream();
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable("id") java.util.UUID id) {
        notificationService.markRead(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasAuthority('broadcast_message.send')")
    public ResponseEntity<ApiResponse<BroadcastMessage>> broadcast(@Valid @RequestBody BroadcastRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(broadcastService.broadcast(request.departmentId(), request.content())));
    }
}
