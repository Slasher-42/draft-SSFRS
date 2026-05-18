package com.example.ProjectWorker_Execution_Service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true)
    private String projectId;

    @Column(nullable = false)
    private String projectTitle;

    @Column(nullable = false)
    private String workerId;

    @Column(nullable = false)
    private String workerName;

    @Column(nullable = false)
    private String providerId;

    @Column(nullable = false)
    private String providerName;

    @Builder.Default
    private boolean workerSigned = false;

    private LocalDateTime workerSignedAt;

    @Builder.Default
    private boolean providerSigned = false;

    private LocalDateTime providerSignedAt;

    @Builder.Default
    private boolean adminValidated = false;

    private LocalDateTime validatedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
