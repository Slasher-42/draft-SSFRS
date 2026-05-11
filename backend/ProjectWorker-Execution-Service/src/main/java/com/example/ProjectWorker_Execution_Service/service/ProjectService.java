package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.CreateProjectRequest;
import com.example.ProjectWorker_Execution_Service.dto.ProjectResponse;
import com.example.ProjectWorker_Execution_Service.dto.RankedWorkerResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;

import java.util.List;

public interface ProjectService {

    ProjectResponse createProject(CreateProjectRequest request, UserPrincipal principal);

    List<ProjectResponse> getMyProjects(UserPrincipal principal);

    List<ProjectResponse> getAssignedProjects(UserPrincipal principal);

    ProjectResponse getProjectById(String projectId, UserPrincipal principal);

    ProjectResponse markCompleted(String projectId, UserPrincipal principal);

    ProjectResponse markFailed(String projectId, UserPrincipal principal);

    List<RankedWorkerResponse> getRankedCandidates(String projectId, UserPrincipal principal);

    ProjectResponse assignWorker(String projectId, String workerId, UserPrincipal principal);
}
