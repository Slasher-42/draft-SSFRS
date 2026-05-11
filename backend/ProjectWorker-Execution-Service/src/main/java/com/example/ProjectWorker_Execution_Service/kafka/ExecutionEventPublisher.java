package com.example.ProjectWorker_Execution_Service.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ExecutionEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publishProjectPosted(String projectId, String providerId) {
        kafkaTemplate.send("project-posted", projectId + ":" + providerId);
    }

    public void publishWorkerCvSubmitted(String workerId) {
        kafkaTemplate.send("worker-cv-submitted", workerId);
    }

    public void publishWorkerAssigned(String projectId, String workerId) {
        kafkaTemplate.send("worker-assigned-to-project", projectId + ":" + workerId);
    }

    public void publishProjectCompleted(String projectId) {
        kafkaTemplate.send("project-marked-completed", projectId);
    }

    public void publishProjectFailed(String projectId) {
        kafkaTemplate.send("project-marked-failed", projectId);
    }

    public void publishClaimFiled(String claimId, String projectId, String workerId) {
        kafkaTemplate.send("claim-filed", claimId + ":" + projectId + ":" + workerId);
    }

    public void publishWorkerClaimResponse(String claimId, String workerId) {
        kafkaTemplate.send("worker-claim-response-submitted", claimId + ":" + workerId);
    }
}
