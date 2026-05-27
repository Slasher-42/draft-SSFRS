package com.example.ProjectWorker_Execution_Service.service;

import com.example.ProjectWorker_Execution_Service.dto.AccountResponse;
import com.example.ProjectWorker_Execution_Service.dto.BankAccountRequest;
import com.example.ProjectWorker_Execution_Service.dto.BankAccountResponse;
import com.example.ProjectWorker_Execution_Service.dto.DepositRequest;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;

import java.util.List;

public interface AccountService {

    AccountResponse getOrCreateAccount(UserPrincipal principal);

    AccountResponse deposit(DepositRequest request, UserPrincipal principal);

    List<BankAccountResponse> getBankAccounts(UserPrincipal principal);

    BankAccountResponse addBankAccount(BankAccountRequest request, UserPrincipal principal);

    BankAccountResponse updateBankAccount(String id, BankAccountRequest request, UserPrincipal principal);

    void deleteBankAccount(String id, UserPrincipal principal);

    void setDefaultBankAccount(String id, UserPrincipal principal);
}
