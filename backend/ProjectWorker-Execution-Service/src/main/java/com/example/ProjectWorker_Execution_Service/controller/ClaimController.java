package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.ClaimResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerClaimResponseRequest;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ClaimResponse> fileClaim(
            @RequestParam("projectId") String projectId,
            @RequestParam("description") String description,
            @RequestParam(value = "proofDocuments", required = false) List<MultipartFile> proofDocuments,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                claimService.fileClaim(projectId, description, proofDocuments, principal));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ClaimResponse>> getMyClaims(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getMyClaims(principal));
    }

    @GetMapping("/against-me")
    public ResponseEntity<List<ClaimResponse>> getClaimsAgainstMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getClaimsAgainstMe(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimResponse> getClaim(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getClaimById(id, principal));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<ClaimResponse> respondToClaim(
            @PathVariable String id,
            @Valid @RequestBody WorkerClaimResponseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.respondToClaim(id, request, principal));
    }
}
