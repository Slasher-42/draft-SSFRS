package com.example.User_Management_Service.service;

import com.example.User_Management_Service.dto.ChangePasswordRequest;
import com.example.User_Management_Service.dto.CreateAdminUserRequest;
import com.example.User_Management_Service.dto.UpdateUserRequest;
import com.example.User_Management_Service.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getUserById(String userId);

    UserResponse updateUser(String userId, UpdateUserRequest request);

    void changePassword(String userId, ChangePasswordRequest request);

    List<UserResponse> getAllUsers();

    UserResponse createRestrictedUser(CreateAdminUserRequest request);

    UserResponse activateUser(String userId);

    UserResponse deactivateUser(String userId);

    void deleteUser(String userId);
}