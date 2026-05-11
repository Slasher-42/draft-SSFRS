package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.WorkerCvResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.WorkerCvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/worker-cv")
@RequiredArgsConstructor
public class WorkerCvController {

    private final WorkerCvService workerCvService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<WorkerCvResponse> submitOrUpdateCv(
            @RequestParam("specialization") String specialization,
            @RequestParam("yearsOfExperience") int yearsOfExperience,
            @RequestParam(value = "additionalCredentials", required = false) String additionalCredentials,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workerCvService.submitOrUpdateCv(
                specialization, yearsOfExperience, additionalCredentials, cvFile, principal));
    }

    @GetMapping("/my")
    public ResponseEntity<WorkerCvResponse> getMyCv(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(workerCvService.getMyCv(principal));
    }

    @GetMapping("/{workerId}")
    public ResponseEntity<WorkerCvResponse> getWorkerCv(@PathVariable String workerId) {
        return ResponseEntity.ok(workerCvService.getWorkerCv(workerId));
    }
}
