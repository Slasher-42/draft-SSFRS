package com.example.User_Management_Service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class UserEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public void publishUserRegistered(String userId, String role) {
        publish(KafkaTopicConfig.USER_REGISTERED, new UserEvent(
                userId,
                EventType.USER_REGISTERED,
                role,
                LocalDateTime.now()
        ));
    }

    public void publishUserDeleted(String userId) {
        publish(KafkaTopicConfig.USER_DELETED, new UserEvent(
                userId,
                EventType.USER_DELETED,
                null,
                LocalDateTime.now()
        ));
    }

    public void publishUserStatusChanged(String userId, String status) {
        publish(KafkaTopicConfig.USER_STATUS_CHANGED, new UserEvent(
                userId,
                EventType.USER_STATUS_CHANGED,
                status,
                LocalDateTime.now()
        ));
    }

    public void publishWorkerProfileSaved(String userId) {
        publish(KafkaTopicConfig.WORKER_PROFILE_SAVED, new UserEvent(
                userId,
                EventType.WORKER_PROFILE_SAVED,
                null,
                LocalDateTime.now()
        ));
    }

    public void publishProjectProviderProfileSaved(String userId) {
        publish(KafkaTopicConfig.PROJECT_PROVIDER_PROFILE_SAVED, new UserEvent(
                userId,
                EventType.PROJECT_PROVIDER_PROFILE_SAVED,
                null,
                LocalDateTime.now()
        ));
    }

    private void publish(String topic, UserEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, event.userId(), message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to publish event to topic: " + topic, e);
        }
    }
}