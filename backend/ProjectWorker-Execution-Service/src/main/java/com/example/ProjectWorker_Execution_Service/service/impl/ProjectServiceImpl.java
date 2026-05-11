package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.CreateProjectRequest;
import com.example.ProjectWorker_Execution_Service.dto.ProjectResponse;
import com.example.ProjectWorker_Execution_Service.dto.RankedWorkerResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.model.WorkerCv;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.repository.WorkerCvRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkerCvRepository workerCvRepository;
    private final ExecutionEventPublisher eventPublisher;

    @Override
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can post projects.");
        }
        Project project = Project.builder()
                .providerId(principal.getUserId())
                .title(request.getTitle())
                .scopeOfWork(request.getScopeOfWork())
                .requiredSkills(request.getRequiredSkills())
                .deadline(request.getDeadline())
                .budget(request.getBudget())
                .build();
        projectRepository.save(project);
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
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
