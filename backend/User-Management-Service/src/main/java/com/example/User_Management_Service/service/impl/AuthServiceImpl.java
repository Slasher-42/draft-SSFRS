package com.example.User_Management_Service.service.impl;

import com.example.User_Management_Service.dto.LoginRequest;
import com.example.User_Management_Service.dto.LoginResponse;
import com.example.User_Management_Service.dto.RegisterRequest;
import com.example.User_Management_Service.dto.UserResponse;
import com.example.User_Management_Service.exception.AccountLockedException;
import com.example.User_Management_Service.exception.DuplicateEmailException;
import com.example.User_Management_Service.exception.UserNotFoundException;
import com.example.User_Management_Service.kafka.UserEventPublisher;
import com.example.User_Management_Service.model.Role;
import com.example.User_Management_Service.model.User;
import com.example.User_Management_Service.repository.UserRepository;
import com.example.User_Management_Service.security.JwtTokenProvider;
import com.example.User_Management_Service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserEventPublisher userEventPublisher;

    private static final int MAX_FAILED_ATTEMPTS = 5;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found with this email."));

        if (user.isLocked()) {
            throw new AccountLockedException("Your account is locked due to multiple failed login attempts.");
        }

        if (!user.isActive()) {
            throw new AccountLockedException("Your account is disabled. Please contact the administrator.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLocked(true);
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password.");
        }

        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("An account with this email already exists.");
        }

        if (request.getRole() == Role.EVALUATOR || request.getRole() == Role.REFUND_OFFICE || request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("This role cannot be self-registered.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .build();

        userRepository.save(user);
        userEventPublisher.publishUserRegistered(user.getId(), user.getRole().name());

        return mapToUserResponse(user);
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