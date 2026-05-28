package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Claim;
import com.example.ProjectWorker_Execution_Service.model.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClaimRepository extends JpaRepository<Claim, String> {

    List<Claim> findAllByProviderIdOrderByCreatedAtDesc(String providerId);

    List<Claim> findAllByWorkerIdOrderByCreatedAtDesc(String workerId);

    Optional<Claim> findByProjectId(String projectId);

    List<Claim> findAllByStatusOrderByCreatedAtDesc(ClaimStatus status);
}
