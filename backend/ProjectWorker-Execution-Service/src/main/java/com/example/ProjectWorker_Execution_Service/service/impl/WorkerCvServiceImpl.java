package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.WorkerCvResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import com.example.ProjectWorker_Execution_Service.service.WorkerCvService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerCvServiceImpl implements WorkerCvService {

    private final WorkerCvRepository workerCvRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;

    @Override
    public WorkerCvResponse submitOrUpdateCv(String specialization, int yearsOfExperience,
                                              String additionalCredentials, MultipartFile cvFile,
                                              UserPrincipal principal) {
        if (!"WORKER".equals(principal.getRole())) {
            throw new ForbiddenException("Only workers can submit a CV.");
        }
        WorkerCvResponse response = persistCv(specialization, yearsOfExperience, additionalCredentials, cvFile, principal);
        if (isReadyForRating(response)) {
            log.info("[CV] Publishing worker-cv-submitted for worker {} (spec={}, exp={})",
                    principal.getUserId(), response.getSpecialization(), response.getYearsOfExperience());
            eventPublisher.publishWorkerCvSubmitted(principal.getUserId());
        } else {
            log.warn("[CV] Skipping rating event for worker {} — spec='{}', exp={}",
                    principal.getUserId(), response.getSpecialization(), response.getYearsOfExperience());
        }
        return response;
    }

    private boolean isReadyForRating(WorkerCvResponse cv) {
        return cv.getSpecialization() != null && !cv.getSpecialization().isBlank()
            && cv.getYearsOfExperience() > 0;
    }

    @Transactional
    protected WorkerCvResponse persistCv(String specialization, int yearsOfExperience,
                                          String additionalCredentials, MultipartFile cvFile,
                                          UserPrincipal principal) {
        Optional<WorkerCv> existing = workerCvRepository.findByWorkerId(principal.getUserId());
        WorkerCv cv = existing.orElseGet(() -> WorkerCv.builder()
                .workerId(principal.getUserId())
                .workerEmail(principal.getEmail())
                .workerName(extractNameFromEmail(principal.getEmail()))
                .ratingScore(0.0)
                .build());

        cv.setSpecialization(specialization);
        cv.setYearsOfExperience(yearsOfExperience);
        cv.setAdditionalCredentials(additionalCredentials != null && !additionalCredentials.isBlank() ? additionalCredentials : null);

        if (cvFile != null && !cvFile.isEmpty()) {
            try {
                String key = s3UploadService.uploadFile(cvFile, "worker-cvs");
                cv.setCvFileKey(key);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload CV file.");
            }
        }

        workerCvRepository.save(cv);
        return toResponse(cv);
    }

    @Override
    public WorkerCvResponse getMyCv(UserPrincipal principal) {
        WorkerCv cv = workerCvRepository.findByWorkerId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("No CV found. Please submit your CV first."));
        return toResponse(cv);
    }

    @Override
    public WorkerCvResponse getWorkerCv(String workerId) {
        WorkerCv cv = workerCvRepository.findByWorkerId(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("CV not found for this worker."));
        return toResponse(cv);
    }

    @Override
    public List<WorkerCvResponse> getAllCvs() {
        return workerCvRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateRatingScore(String workerId, double score, String reasoning) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setRatingScore(score);
            cv.setRatingReasoning(reasoning);
            workerCvRepository.save(cv);
        });
    }

    @Override
    @Transactional
    public void updateApprovalStatus(String workerId, String status) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setApprovalStatus(status);
            workerCvRepository.save(cv);
        });
    }

    @Override
    @Transactional
    public void incrementCompletedProjects(String workerId) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setCompletedProjects(cv.getCompletedProjects() + 1);
            workerCvRepository.save(cv);
        });
    }

    @Override
    @Transactional
    public void incrementPastFailures(String workerId) {
        workerCvRepository.findByWorkerId(workerId).ifPresent(cv -> {
            cv.setPastFailures(cv.getPastFailures() + 1);
            workerCvRepository.save(cv);
        });
    }

    private WorkerCvResponse toResponse(WorkerCv cv) {
        return WorkerCvResponse.builder()
                .id(cv.getId())
                .workerId(cv.getWorkerId())
                .workerName(cv.getWorkerName())
                .workerEmail(cv.getWorkerEmail())
                .cvFileUrl(s3UploadService.generatePresignedUrl(cv.getCvFileKey()))
                .yearsOfExperience(cv.getYearsOfExperience())
                .specialization(cv.getSpecialization())
                .additionalCredentials(cv.getAdditionalCredentials())
                .ratingScore(cv.getRatingScore())
                .ratingReasoning(cv.getRatingReasoning())
                .approvalStatus(cv.getApprovalStatus())
                .createdAt(cv.getCreatedAt())
                .updatedAt(cv.getUpdatedAt())
                .build();
    }

    private String extractNameFromEmail(String email) {
        if (email == null) return "Worker";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
