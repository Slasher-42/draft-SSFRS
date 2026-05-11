package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.ProjectImageResponse;
import com.example.ProjectWorker_Execution_Service.dto.ProjectResponse;
import com.example.ProjectWorker_Execution_Service.dto.RankedWorkerResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectImage;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import com.example.ProjectWorker_Execution_Service.repository.ProjectImageRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ProjectService;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectImageRepository projectImageRepository;
    private final WorkerCvRepository workerCvRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;

    @Override
    @Transactional
    public ProjectResponse createProject(String title, String scopeOfWork, String requiredSkills,
                                          LocalDate deadline, BigDecimal budget,
                                          List<MultipartFile> images, List<String> imageDescriptions,
                                          UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can post projects.");
        }

        Project project = Project.builder()
                .providerId(principal.getUserId())
                .title(title)
                .scopeOfWork(scopeOfWork)
                .requiredSkills(requiredSkills)
                .deadline(deadline)
                .budget(budget)
                .build();
        projectRepository.save(project);

        saveImages(project.getId(), images, imageDescriptions);

        eventPublisher.publishProjectPosted(project.getId(), principal.getUserId());
        return toResponse(project);
    }

    @Override
    public List<ProjectResponse> getMyProjects(UserPrincipal principal) {
        return projectRepository.findAllByProviderIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ProjectResponse> getAssignedProjects(UserPrincipal principal) {
        return projectRepository.findAllByAssignedWorkerIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ProjectResponse getProjectById(String projectId, UserPrincipal principal) {
        Project project = findProject(projectId);
        boolean isProvider = project.getProviderId().equals(principal.getUserId());
        boolean isWorker = principal.getUserId().equals(project.getAssignedWorkerId());
        if (!isProvider && !isWorker && !"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Access denied.");
        }
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse markCompleted(String projectId, UserPrincipal principal) {
        Project project = findAndVerifyOwner(projectId, principal);
        if (project.getStatus() != ProjectStatus.ASSIGNED) {
            throw new IllegalArgumentException("Only assigned projects can be marked as completed.");
        }
        project.setStatus(ProjectStatus.COMPLETED);
        projectRepository.save(project);
        eventPublisher.publishProjectCompleted(projectId);
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse markFailed(String projectId, UserPrincipal principal) {
        Project project = findAndVerifyOwner(projectId, principal);
        if (project.getStatus() != ProjectStatus.ASSIGNED) {
            throw new IllegalArgumentException("Only assigned projects can be marked as failed.");
        }
        project.setStatus(ProjectStatus.FAILED);
        projectRepository.save(project);
        eventPublisher.publishProjectFailed(projectId);
        return toResponse(project);
    }

    @Override
    public List<RankedWorkerResponse> getRankedCandidates(String projectId, UserPrincipal principal) {
        Project project = findAndVerifyOwner(projectId, principal);
        List<WorkerCv> allCvs = workerCvRepository.findAll();
        return allCvs.stream()
                .map(cv -> {
                    double rank = cv.getRatingScore() * 5;
                    rank += cv.getYearsOfExperience() * 2.0;
                    if (project.getRequiredSkills().toLowerCase()
                            .contains(cv.getSpecialization().toLowerCase())) {
                        rank += 20;
                    }
                    return RankedWorkerResponse.builder()
                            .workerId(cv.getWorkerId())
                            .workerName(cv.getWorkerName())
                            .workerEmail(cv.getWorkerEmail())
                            .specialization(cv.getSpecialization())
                            .yearsOfExperience(cv.getYearsOfExperience())
                            .ratingScore(cv.getRatingScore())
                            .rankScore(rank)
                            .build();
                })
                .sorted(Comparator.comparingDouble(RankedWorkerResponse::getRankScore).reversed())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProjectResponse assignWorker(String projectId, String workerId, UserPrincipal principal) {
        Project project = findAndVerifyOwner(projectId, principal);
        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new IllegalArgumentException("Only open projects can have a worker assigned.");
        }
        project.setAssignedWorkerId(workerId);
        project.setStatus(ProjectStatus.ASSIGNED);
        projectRepository.save(project);
        eventPublisher.publishWorkerAssigned(projectId, workerId);
        return toResponse(project);
    }

    private void saveImages(String projectId, List<MultipartFile> images, List<String> descriptions) {
        if (images == null || images.isEmpty()) return;
        List<ProjectImage> toSave = new ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            if (file == null || file.isEmpty()) continue;
            String description = (descriptions != null && i < descriptions.size()
                    && descriptions.get(i) != null && !descriptions.get(i).isBlank())
                    ? descriptions.get(i)
                    : "Supporting image " + (i + 1);
            try {
                String key = s3UploadService.uploadFile(file, "project-images");
                toSave.add(ProjectImage.builder()
                        .projectId(projectId)
                        .imageKey(key)
                        .description(description)
                        .displayOrder(i)
                        .build());
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload image: " + file.getOriginalFilename());
            }
        }
        projectImageRepository.saveAll(toSave);
    }

    private Project findProject(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));
    }

    private Project findAndVerifyOwner(String projectId, UserPrincipal principal) {
        Project project = findProject(projectId);
        if (!project.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You do not own this project.");
        }
        return project;
    }

    private ProjectResponse toResponse(Project p) {
        List<ProjectImageResponse> images = projectImageRepository
                .findAllByProjectIdOrderByDisplayOrderAsc(p.getId())
                .stream()
                .map(img -> ProjectImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(s3UploadService.generatePresignedUrl(img.getImageKey()))
                        .description(img.getDescription())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        return ProjectResponse.builder()
                .id(p.getId())
                .providerId(p.getProviderId())
                .title(p.getTitle())
                .scopeOfWork(p.getScopeOfWork())
                .requiredSkills(p.getRequiredSkills())
                .deadline(p.getDeadline())
                .budget(p.getBudget())
                .status(p.getStatus().name())
                .assignedWorkerId(p.getAssignedWorkerId())
                .images(images)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
