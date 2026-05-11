package com.example.ProjectWorker_Execution_Service.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ProjectResponse {
    private String id;
    private String providerId;
    private String title;
    private String scopeOfWork;
    private String requiredSkills;
    private LocalDate deadline;
    private BigDecimal budget;
    private String status;
    private String assignedWorkerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
