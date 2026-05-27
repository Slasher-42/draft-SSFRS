package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.AccountResponse;
import com.example.ProjectWorker_Execution_Service.dto.BankAccountRequest;
import com.example.ProjectWorker_Execution_Service.dto.BankAccountResponse;
import com.example.ProjectWorker_Execution_Service.dto.DepositRequest;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.model.Account;
import com.example.ProjectWorker_Execution_Service.model.BankAccount;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.repository.AccountRepository;
import com.example.ProjectWorker_Execution_Service.repository.BankAccountRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional
    public AccountResponse getOrCreateAccount(UserPrincipal principal) {
        return toResponse(accountRepository.findByUserId(principal.getUserId())
                .orElseGet(() -> accountRepository.save(Account.builder()
                        .userId(principal.getUserId())
                        .role(principal.getRole())
                        .accountNumber(generateUniqueAccountNumber())
                        .build())));
    }

    @Override
    public List<BankAccountResponse> getBankAccounts(UserPrincipal principal) {
        return bankAccountRepository.findAllByUserIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toBankAccountResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BankAccountResponse addBankAccount(BankAccountRequest request, UserPrincipal principal) {
        long count = bankAccountRepository.countByUserId(principal.getUserId());
        BankAccount saved = bankAccountRepository.save(BankAccount.builder()
                .userId(principal.getUserId())
                .bankName(request.getBankName())
                .accountNumber(request.getAccountNumber())
                .accountHolderName(request.getAccountHolderName())
                .defaultAccount(count == 0)
                .build());
        return toBankAccountResponse(saved);
    }

    @Override
    @Transactional
    public BankAccountResponse updateBankAccount(String id, BankAccountRequest request, UserPrincipal principal) {
        BankAccount account = bankAccountRepository.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found."));
        account.setBankName(request.getBankName());
        account.setAccountNumber(request.getAccountNumber());
        account.setAccountHolderName(request.getAccountHolderName());
        return toBankAccountResponse(bankAccountRepository.save(account));
    }

    @Override
    @Transactional
    public void deleteBankAccount(String id, UserPrincipal principal) {
        BankAccount account = bankAccountRepository.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found."));
        boolean wasDefault = account.isDefaultAccount();
        bankAccountRepository.delete(account);
        if (wasDefault) {
            bankAccountRepository.findAllByUserIdOrderByCreatedAtDesc(principal.getUserId())
                    .stream().findFirst().ifPresent(first -> {
                        first.setDefaultAccount(true);
                        bankAccountRepository.save(first);
                    });
        }
    }

    @Override
    @Transactional
    public void setDefaultBankAccount(String id, UserPrincipal principal) {
        List<BankAccount> accounts = bankAccountRepository.findAllByUserIdOrderByCreatedAtDesc(principal.getUserId());
        boolean found = accounts.stream().anyMatch(a -> a.getId().equals(id));
        if (!found) throw new ResourceNotFoundException("Bank account not found.");
        accounts.forEach(a -> a.setDefaultAccount(a.getId().equals(id)));
        bankAccountRepository.saveAll(accounts);
    }

    @Override
    @Transactional
    public AccountResponse deposit(DepositRequest request, UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can deposit funds.");
        }

        bankAccountRepository.findByIdAndUserId(request.getBankAccountId(), principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found."));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (!project.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You do not own this project.");
        }

        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new IllegalArgumentException("Only OPEN projects can be funded.");
        }

        if (Boolean.TRUE.equals(project.getFunded())) {
            throw new IllegalArgumentException("This project has already been funded.");
        }

        if (request.getAmount().compareTo(project.getBudget()) != 0) {
            throw new IllegalArgumentException(
                    "Deposit amount must exactly match the project budget of " + project.getBudget() + ".");
        }

        Account account = accountRepository.findByUserId(principal.getUserId())
                .orElseGet(() -> accountRepository.save(Account.builder()
                        .userId(principal.getUserId())
                        .role(principal.getRole())
                        .accountNumber(generateUniqueAccountNumber())
                        .build()));

        account.setBalance(account.getBalance().add(request.getAmount()));
        account.setPendingBalance(account.getPendingBalance().add(request.getAmount()));
        accountRepository.save(account);

        project.setFunded(true);
        projectRepository.save(project);

        return toResponse(account);
    }

    private String generateUniqueAccountNumber() {
        String num;
        do {
            num = String.format("%010d", ThreadLocalRandom.current().nextLong(0, 10_000_000_000L));
        } while (accountRepository.existsByAccountNumber(num));
        return num;
    }

    private AccountResponse toResponse(Account a) {
        return AccountResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .role(a.getRole())
                .accountNumber(a.getAccountNumber())
                .balance(a.getBalance())
                .pendingBalance(a.getPendingBalance())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private BankAccountResponse toBankAccountResponse(BankAccount b) {
        return BankAccountResponse.builder()
                .id(b.getId())
                .bankName(b.getBankName())
                .accountNumber(b.getAccountNumber())
                .accountHolderName(b.getAccountHolderName())
                .defaultAccount(b.isDefaultAccount())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
