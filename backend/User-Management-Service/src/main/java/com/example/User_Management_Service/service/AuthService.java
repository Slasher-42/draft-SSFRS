package com.example.User_Management_Service.service;

import com.example.User_Management_Service.dto.LoginRequest;
import com.example.User_Management_Service.dto.LoginResponse;
import com.example.User_Management_Service.dto.RegisterRequest;
import com.example.User_Management_Service.dto.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    UserResponse register(RegisterRequest request);
}