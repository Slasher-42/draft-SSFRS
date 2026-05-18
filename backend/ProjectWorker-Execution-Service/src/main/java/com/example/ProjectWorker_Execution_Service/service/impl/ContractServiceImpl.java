package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.ContractResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.model.Contract;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.repository.ContractRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public ContractResponse getOrCreateForProject(String projectId, UserPrincipal principal) {
        return contractRepository.findByProjectId(projectId)
                .map(this::toResponse)
                .orElseGet(() -> {
                    Project project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
                    if (project.getAssignedWorkerId() == null) {
                        throw new ForbiddenException("No worker has been assigned to this project yet.");
                    }
                    Contract c = Contract.builder()
                            .projectId(projectId)
                            .projectTitle(project.getTitle())
                            .workerId(project.getAssignedWorkerId())
                            .workerName("Worker")
                            .providerId(project.getProviderId())
                            .providerName(extractName(principal.getEmail()))
                            .build();
                    contractRepository.save(c);
                    return toResponse(c);
                });
    }

    @Override
    public List<ContractResponse> getMyContracts(UserPrincipal principal) {
        String role = principal.getRole();
        if ("WORKER".equals(role)) {
            return contractRepository.findByWorkerIdOrderByCreatedAtDesc(principal.getUserId())
                    .stream().map(this::toResponse).collect(Collectors.toList());
        } else if ("PROVIDER".equals(role)) {
            return contractRepository.findByProviderIdOrderByCreatedAtDesc(principal.getUserId())
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }
        return List.of();
    }

    @Override
    @Transactional
    public ContractResponse sign(String contractId, UserPrincipal principal) {
        Contract c = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        String role = principal.getRole();
        if ("WORKER".equals(role)) {
            if (!principal.getUserId().equals(c.getWorkerId())) {
                throw new ForbiddenException("You are not the assigned worker for this contract.");
            }
            c.setWorkerSigned(true);
            c.setWorkerSignedAt(LocalDateTime.now());
        } else if ("PROVIDER".equals(role)) {
            if (!principal.getUserId().equals(c.getProviderId())) {
                throw new ForbiddenException("You are not the provider for this contract.");
            }
            c.setProviderSigned(true);
            c.setProviderSignedAt(LocalDateTime.now());
        } else {
            throw new ForbiddenException("Only workers and providers can sign contracts.");
        }
        contractRepository.save(c);
        return toResponse(c);
    }

    @Override
    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ContractResponse validate(String contractId) {
        Contract c = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        if (!c.isWorkerSigned() || !c.isProviderSigned()) {
            throw new ForbiddenException("Both parties must sign before admin can validate.");
        }
        c.setAdminValidated(true);
        c.setValidatedAt(LocalDateTime.now());
        contractRepository.save(c);
        return toResponse(c);
    }

    private ContractResponse toResponse(Contract c) {
        return ContractResponse.builder()
                .id(c.getId())
                .projectId(c.getProjectId())
                .projectTitle(c.getProjectTitle())
                .workerId(c.getWorkerId())
                .workerName(c.getWorkerName())
                .providerId(c.getProviderId())
                .providerName(c.getProviderName())
                .workerSigned(c.isWorkerSigned())
                .workerSignedAt(c.getWorkerSignedAt())
                .providerSigned(c.isProviderSigned())
                .providerSignedAt(c.getProviderSignedAt())
                .adminValidated(c.isAdminValidated())
                .validatedAt(c.getValidatedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private String extractName(String email) {
        if (email == null) return "Provider";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
