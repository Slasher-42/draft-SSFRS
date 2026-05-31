package com.example.User_Management_Service.controller;

import com.example.User_Management_Service.dto.ChangePasswordRequest;
import com.example.User_Management_Service.dto.UpdateUserRequest;
import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @GetMapping("/by-role/{role}")
    @PreAuthorize("hasAnyRole('EVALUATOR', 'REFUND_OFFICE', 'ADMIN')")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @PostMapping("/staff-message")
    @PreAuthorize("hasAnyRole('EVALUATOR', 'REFUND_OFFICE', 'ADMIN')")
    public ResponseEntity<Void> sendStaffMessage(@RequestBody Map<String, String> body) {
        String recipientId = body.get("recipientId");
        String subject     = body.get("subject");
        String message     = body.get("message");
        if (recipientId == null || subject == null || message == null) {
            throw new IllegalArgumentException("recipientId, subject, and message are required.");
        }
        userService.sendStaffMessage(recipientId, subject, message);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable String userId,
                                                   @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @PatchMapping("/{userId}/change-password")
    public ResponseEntity<Void> changePassword(@PathVariable String userId,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/profile-image")
    public ResponseEntity<UserResponse> uploadProfileImage(@PathVariable String userId,
                                                           @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadProfileImage(userId, file));
    }
}