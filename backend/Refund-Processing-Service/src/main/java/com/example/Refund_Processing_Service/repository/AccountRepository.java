package com.example.Refund_Processing_Service.repository;

import com.example.Refund_Processing_Service.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, String> {

    Optional<Account> findByUserId(String userId);

    boolean existsByAccountNumber(String accountNumber);

    long countByPendingBalanceGreaterThan(BigDecimal amount);

    @Query("SELECT COALESCE(SUM(a.pendingBalance), 0) FROM Account a")
    BigDecimal sumPendingBalance();
}
