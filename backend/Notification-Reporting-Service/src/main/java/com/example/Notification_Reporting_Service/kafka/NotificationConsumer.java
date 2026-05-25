package com.example.Notification_Reporting_Service.kafka;

import com.example.Notification_Reporting_Service.model.Notification;
import com.example.Notification_Reporting_Service.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Transactional
    @KafkaListener(topics = "worker-assigned-to-project", groupId = "notification-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerAssigned(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String payload = record.value();
        log.info("[Notification] worker-assigned-to-project: {}", payload);

        if (payload == null || !payload.trim().startsWith("{")) {
            log.warn("[Notification] Skipping legacy non-JSON payload: {}", payload);
            ack.acknowledge();
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> data = MAPPER.readValue(payload, Map.class);

            String projectId    = data.get("projectId");
            String workerId     = data.get("workerId");
            String providerId   = data.get("providerId");
            String projectTitle = data.getOrDefault("projectTitle", "a project");

            if (projectId == null || workerId == null || providerId == null) {
                log.warn("[Notification] Incomplete worker-assigned payload, skipping: {}", payload);
                ack.acknowledge();
                return;
            }

            String workerData = MAPPER.writeValueAsString(Map.of(
                    "projectId", projectId,
                    "projectTitle", projectTitle
            ));
            notificationRepository.save(Notification.builder()
                    .recipientId(workerId)
                    .type("WORKER_ASSIGNED")
                    .title("Project Assignment")
                    .message("You have been assigned to the project \"" + projectTitle + "\". Click to view project details.")
                    .data(workerData)
                    .build());

            String providerData = MAPPER.writeValueAsString(Map.of(
                    "projectId", projectId,
                    "projectTitle", projectTitle,
                    "workerId", workerId
            ));
            notificationRepository.save(Notification.builder()
                    .recipientId(providerId)
                    .type("PROVIDER_WORKER_ASSIGNED")
                    .title("Worker Assigned to Your Project")
                    .message("A worker has been assigned to your project \"" + projectTitle + "\". Click to view worker details.")
                    .data(providerData)
                    .build());

            ack.acknowledge();
            log.info("[Notification] Saved assignment notifications for worker={} provider={}", workerId, providerId);
        } catch (Exception e) {
            log.error("[Notification] Failed to process worker-assigned-to-project: {}", e.getMessage(), e);
        }
    }

    @Transactional
    @KafkaListener(topics = "worker-cv-approval", groupId = "notification-service-group",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onWorkerApproval(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String payload = record.value();
        log.info("[Notification] worker-cv-approval: {}", payload);
        try {
            int sep = payload.lastIndexOf(':');
            if (sep < 0) {
                log.warn("[Notification] Malformed worker-cv-approval payload: {}", payload);
                ack.acknowledge();
                return;
            }
            String workerId = payload.substring(0, sep);
            String status   = payload.substring(sep + 1);

            String type;
            String title;
            String message;

            if ("APPROVED".equalsIgnoreCase(status)) {
                type    = "WORKER_APPROVED";
                title   = "CV Application Approved";
                message = "Congratulations! Your CV has been approved by the admin. You are now eligible to be assigned to projects.";
            } else if ("REJECTED".equalsIgnoreCase(status)) {
                type    = "WORKER_REJECTED";
                title   = "CV Application Rejected";
                message = "Your CV application has been reviewed and was not approved at this time. Please update your profile and resubmit.";
            } else {
                type    = "WORKER_CV_STATUS";
                title   = "CV Application Update";
                message = "Your CV application status has been updated to: " + status + ".";
            }

            notificationRepository.save(Notification.builder()
                    .recipientId(workerId)
                    .type(type)
                    .title(title)
                    .message(message)
                    .data("{}")
                    .build());

            ack.acknowledge();
            log.info("[Notification] Saved CV approval notification for worker={} status={}", workerId, status);
        } catch (Exception e) {
            log.error("[Notification] Failed to process worker-cv-approval: {}", e.getMessage(), e);
        }
    }
}
