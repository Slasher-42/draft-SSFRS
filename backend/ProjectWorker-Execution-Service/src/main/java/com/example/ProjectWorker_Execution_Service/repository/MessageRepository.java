package com.example.ProjectWorker_Execution_Service.repository;

import com.example.ProjectWorker_Execution_Service.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByConversationIdOrderBySentAtAsc(String conversationId);

    List<Message> findDistinctByConversationIdContainingOrderBySentAtDesc(String userId);
}
