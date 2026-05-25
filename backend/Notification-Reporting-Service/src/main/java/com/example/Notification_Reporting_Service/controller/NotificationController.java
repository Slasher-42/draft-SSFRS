package com.example.Notification_Reporting_Service.controller;

import com.example.Notification_Reporting_Service.dto.NotificationResponse;
import com.example.Notification_Reporting_Service.model.Notification;
import com.example.Notification_Reporting_Service.repository.NotificationRepository;
import com.example.Notification_Reporting_Service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<NotificationResponse> notifications = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(principal.getUserId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/my/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationRepository.countByRecipientIdAndReadFalse(principal.getUserId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @Transactional
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipientId().equals(principal.getUserId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationRepository.markAllReadByRecipientId(principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .data(n.getData())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
