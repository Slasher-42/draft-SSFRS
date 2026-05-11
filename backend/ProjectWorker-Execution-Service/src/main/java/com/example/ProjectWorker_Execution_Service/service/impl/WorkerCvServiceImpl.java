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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WorkerCvServiceImpl implements WorkerCvService {

    private final WorkerCvRepository workerCvRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;

    @Override
    @Transactional
    public WorkerCvResponse submitOrUpdateCv(String specialization, int yearsOfExperience,
                                              String additionalCredentials, MultipartFile cvFile,
                                              UserPrincipal principal) {
        if (!"WORKER".equals(principal.getRole())) {
            throw new ForbiddenException("Only workers can submit a CV.");
        }

        Optional<WorkerCv> existing = workerCvRepository.findByWorkerId(principal.getUserId());
        WorkerCv cv;

        if (existing.isPresent()) {
            cv = existing.get();
        } else {
            cv = WorkerCv.builder()
                    .workerId(principal.getUserId())
                    .workerEmail(principal.getEmail())
                    .workerName(extractNameFromEmail(principal.getEmail()))
                    .ratingScore(0.0)
                    .build();
        }

        cv.setSpecialization(specialization);
        cv.setYearsOfExperience(yearsOfExperience);
        cv.setAdditionalCredentials(additionalCredentials);

        if (cvFile != null && !cvFile.isEmpty()) {
            try {
                String key = s3UploadService.uploadFile(cvFile, "worker-cvs");
                cv.setCvFileKey(key);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload CV file.");
            }
        }

        workerCvRepository.save(cv);
        eventPublisher.publishWorkerCvSubmitted(principal.getUserId());

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
                .createdAt(cv.getCreatedAt())
                .updatedAt(cv.getUpdatedAt())
                .build();
    }

    private String extractNameFromEmail(String email) {
        if (email == null) return "Worker";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
