package com.example.ProjectWorker_Execution_Service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class DepositRequest {

    @NotBlank
    private String projectId;

    @NotBlank
    private String bankAccountId;

    @NotNull
    @Positive
    private BigDecimal amount;
}
