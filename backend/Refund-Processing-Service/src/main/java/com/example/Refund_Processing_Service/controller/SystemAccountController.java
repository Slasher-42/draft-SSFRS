package com.example.Refund_Processing_Service.controller;

import com.example.Refund_Processing_Service.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemAccountController {

    private final AccountRepository accountRepository;

    @GetMapping("/account")
    @PreAuthorize("hasAuthority('REFUND_OFFICE') or hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemAccount() {
        BigDecimal totalBlocked = accountRepository.sumPendingBalance();
        long blockedAccounts    = accountRepository.countByPendingBalanceGreaterThan(BigDecimal.ZERO);
        long totalAccounts      = accountRepository.count();

        return ResponseEntity.ok(Map.of(
                "totalBlockedAmount", totalBlocked != null ? totalBlocked : BigDecimal.ZERO,
                "accountsWithPendingFunds", blockedAccounts,
                "totalAccounts", totalAccounts
        ));
    }
}
