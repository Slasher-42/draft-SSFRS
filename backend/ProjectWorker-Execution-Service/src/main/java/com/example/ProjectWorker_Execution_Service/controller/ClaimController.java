package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.ClaimResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerClaimResponseRequest;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @PostMapping(path = "/api/claims", consumes = "multipart/form-data")
    public ResponseEntity<ClaimResponse> fileClaim(
            @RequestParam("projectId") String projectId,
            @RequestParam("description") String description,
            @RequestParam(value = "proofDocuments", required = false) List<MultipartFile> proofDocuments,
            @RequestParam(value = "ghostProjectImages", required = false) List<MultipartFile> ghostProjectImages,
            @RequestParam(value = "messageEvidenceJson", required = false) String messageEvidenceJson,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                claimService.fileClaim(projectId, description, proofDocuments,
                        ghostProjectImages, messageEvidenceJson, principal));
    }

    @GetMapping("/api/claims/my")
    public ResponseEntity<List<ClaimResponse>> getMyClaims(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getMyClaims(principal));
    }

    @GetMapping("/api/claims/against-me")
    public ResponseEntity<List<ClaimResponse>> getClaimsAgainstMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getClaimsAgainstMe(principal));
    }

    @GetMapping("/api/claims/{id}")
    public ResponseEntity<ClaimResponse> getClaim(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getClaimById(id, principal));
    }

    @PostMapping("/api/claims/{id}/respond")
    public ResponseEntity<ClaimResponse> respondToClaim(
            @PathVariable String id,
            @Valid @RequestBody WorkerClaimResponseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.respondToClaim(id, request, principal));
    }

    @PatchMapping("/api/internal/claims/{id}/mediation")
    public ResponseEntity<Void> updateMediationReport(
            @PathVariable String id,
            @RequestHeader("X-Internal-Key") String key,
            @RequestBody Map<String, String> body) {
        if (!internalApiKey.equals(key)) {
            throw new ForbiddenException("Invalid internal API key.");
        }
        claimService.updateAiMediationReport(id, body.get("aiMediationReport"));
        return ResponseEntity.noContent().build();
    }
}
