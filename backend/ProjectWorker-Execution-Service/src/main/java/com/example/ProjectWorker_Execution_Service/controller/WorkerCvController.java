package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.WorkerCvResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.WorkerCvService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class WorkerCvController {

    private final WorkerCvService workerCvService;

    @Value("${internal.api-key}")
    private String internalApiKey;

    // ─── Public (JWT-authenticated) endpoints ───────────────────────────────

    @PostMapping(path = "/api/worker-cv", consumes = "multipart/form-data")
    public ResponseEntity<WorkerCvResponse> submitOrUpdateCv(
            @RequestParam("specialization") String specialization,
            @RequestParam("yearsOfExperience") int yearsOfExperience,
            @RequestParam(value = "additionalCredentials", required = false) String additionalCredentials,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workerCvService.submitOrUpdateCv(
                specialization, yearsOfExperience, additionalCredentials, cvFile, principal));
    }

    @GetMapping("/api/worker-cv/my")
    public ResponseEntity<WorkerCvResponse> getMyCv(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workerCvService.getMyCv(principal));
    }

    @GetMapping("/api/worker-cv/{workerId}")
    public ResponseEntity<WorkerCvResponse> getWorkerCv(@PathVariable String workerId) {
        return ResponseEntity.ok(workerCvService.getWorkerCv(workerId));
    }

    @GetMapping("/api/worker-cv/all")
    public ResponseEntity<List<WorkerCvResponse>> getAllCvs(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admins can view all worker CVs.");
        }
        return ResponseEntity.ok(workerCvService.getAllCvs());
    }

    // ─── Internal endpoints (called by AI Service, API key protected) ────────

    @PatchMapping("/api/internal/worker-cv/{workerId}/rating")
    public ResponseEntity<Void> updateRating(
            @PathVariable String workerId,
            @RequestHeader("X-Internal-Key") String key,
            @RequestBody Map<String, Object> body) {
        validateKey(key);
        double score = Double.parseDouble(body.get("ratingScore").toString());
        workerCvService.updateRatingScore(workerId, score);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/internal/worker-cv/{workerId}/stats")
    public ResponseEntity<Void> updateStats(
            @PathVariable String workerId,
            @RequestHeader("X-Internal-Key") String key,
            @RequestBody Map<String, Object> body) {
        validateKey(key);
        if (body.containsKey("incrementCompletedProjects")) {
            workerCvService.incrementCompletedProjects(workerId);
        }
        if (body.containsKey("incrementPastFailures")) {
            workerCvService.incrementPastFailures(workerId);
        }
        return ResponseEntity.noContent().build();
    }

    private void validateKey(String key) {
        if (!internalApiKey.equals(key)) {
            throw new ForbiddenException("Invalid internal API key.");
        }
    }
}
