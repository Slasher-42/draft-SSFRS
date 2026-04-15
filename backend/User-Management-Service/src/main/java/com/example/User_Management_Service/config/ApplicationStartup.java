package com.example.User_Management_Service.config;

import com.example.User_Management_Service.model.Role;
import com.example.User_Management_Service.model.User;
import com.example.User_Management_Service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class ApplicationStartup {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedAdmin() {
        return args -> {
            if (userRepository.findAllByRole(Role.ADMIN).isEmpty()) {
                User admin = User.builder()
                        .fullName("System Admin")
                        .email("admin@system.com")
                        .password(passwordEncoder.encode("Admin@1234"))
                        .phone("0000000000")
                        .role(Role.ADMIN)
                        .active(true)
                        .locked(false)
                        .build();
                userRepository.save(admin);
            }
        };
    }
}