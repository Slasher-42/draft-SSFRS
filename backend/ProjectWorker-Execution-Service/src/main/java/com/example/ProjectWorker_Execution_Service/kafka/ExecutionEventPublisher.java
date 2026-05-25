package com.example.ProjectWorker_Execution_Service.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publishProjectPosted(String projectId, String providerId) {
        send("project-posted", projectId + ":" + providerId);
    }

    public void publishWorkerCvSubmitted(String workerId) {
        send("worker-cv-submitted", workerId);
    }

    public void publishWorkerAssigned(String projectId, String workerId) {
        send("worker-assigned-to-project", projectId + ":" + workerId);
    }

    public void publishProjectCompleted(String projectId) {
        send("project-marked-completed", projectId);
    }

    public void publishProjectFailed(String projectId) {
        send("project-marked-failed", projectId);
    }

    public void publishClaimFiled(String claimId, String projectId, String workerId) {
        send("claim-filed", claimId + ":" + projectId + ":" + workerId);
    }

    public void publishWorkerClaimResponse(String claimId, String workerId) {
        send("worker-claim-response-submitted", claimId + ":" + workerId);
    }

    private void send(String topic, String payload) {
        try {
            kafkaTemplate.send(topic, payload).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("[Kafka] FAILED to publish to '{}' payload='{}': {}", topic, payload, ex.getMessage());
                } else {
                    log.info("[Kafka] Published to '{}': {}", topic, payload);
                }
            });
        } catch (Exception e) {
            log.error("[Kafka] Exception publishing to '{}': {}", topic, e.getMessage());
        }
    }
}
