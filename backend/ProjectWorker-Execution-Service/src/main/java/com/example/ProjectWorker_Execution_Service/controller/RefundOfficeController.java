package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.dto.ClaimResponse;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/refund-office")
@RequiredArgsConstructor
public class RefundOfficeController {

    private final ClaimService claimService;

    @GetMapping("/claims")
    public ResponseEntity<List<ClaimResponse>> getRefundPendingClaims(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.getRefundPendingClaims(principal));
    }

    @PatchMapping("/claims/{id}/process-refund")
    public ResponseEntity<ClaimResponse> processRefund(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(claimService.processRefund(id, principal));
    }
}
