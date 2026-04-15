package com.example.User_Management_Service.service.impl;

import com.example.User_Management_Service.dto.ChangePasswordRequest;
import com.example.User_Management_Service.dto.CreateAdminUserRequest;
import com.example.User_Management_Service.dto.UpdateUserRequest;
import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.exception.DuplicateEmailException;
import com.example.User_Management_Service.exception.UserNotFoundException;
import com.example.User_Management_Service.kafka.UserEventPublisher;
import com.example.User_Management_Service.model.User;
import com.example.User_Management_Service.repository.UserRepository;
import com.example.User_Management_Service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserEventPublisher userEventPublisher;

    @Override
    public UserResponse getUserById(String userId) {
        User user = findUserById(userId);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(String userId, UpdateUserRequest request) {
        User user = findUserById(userId);
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = findUserById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse createRestrictedUser(CreateAdminUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("An account with this email already exists.");
        }
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getTemporaryPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .build();
        userRepository.save(user);
        userEventPublisher.publishUserRegistered(user.getId(), user.getRole().name());
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse activateUser(String userId) {
        User user = findUserById(userId);
        user.setActive(true);
        user.setLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        userEventPublisher.publishUserStatusChanged(user.getId(), "ACTIVATED");
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse deactivateUser(String userId) {
        User user = findUserById(userId);
        user.setActive(false);
        userRepository.save(user);
        userEventPublisher.publishUserStatusChanged(user.getId(), "DEACTIVATED");
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        User user = findUserById(userId);
        userRepository.delete(user);
        userEventPublisher.publishUserDeleted(user.getId());
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .active(user.isActive())
                .locked(user.isLocked())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}