package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.ClaimResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerClaimResponseRequest;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ClaimService {

    ClaimResponse fileClaim(String projectId, String description,
                             List<MultipartFile> proofDocuments, UserPrincipal principal);

    List<ClaimResponse> getMyClaims(UserPrincipal principal);

    List<ClaimResponse> getClaimsAgainstMe(UserPrincipal principal);

    ClaimResponse getClaimById(String claimId, UserPrincipal principal);

    ClaimResponse respondToClaim(String claimId, WorkerClaimResponseRequest request,
                                  UserPrincipal principal);
}
