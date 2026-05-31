package com.example.ProjectWorker_Execution_Service.controller;

import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Internal endpoints consumed by the AI Chat Service to get live system context.
 * Protected by a shared internal API key — NOT exposed to end users.
 */
@RestController
@RequiredArgsConstructor
public class InternalAiContextController {

    private final ProjectRepository projectRepository;

    @Value("${internal.api-key}")
    private String internalApiKey;

    @GetMapping("/api/projects/available-for-ai")
    public ResponseEntity<List<Map<String, Object>>> getOpenProjects(
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {
        if (!internalApiKey.equals(key)) {
            return ResponseEntity.status(403).build();
        }
        List<Project> open = projectRepository.findAllByStatus(ProjectStatus.OPEN);
        List<Map<String, Object>> result = open.stream().map(p -> Map.<String, Object>of(
                "id",                   p.getId(),
                "title",                p.getTitle() != null ? p.getTitle() : "",
                "category",             p.getCategory() != null ? p.getCategory().name() : "General",
                "budget",               p.getBudget() != null ? p.getBudget().toPlainString() : "0",
                "constructionLocation", p.getConstructionLocation() != null ? p.getConstructionLocation() : ""
        )).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/workers/available-for-ai")
    public ResponseEntity<List<Map<String, Object>>> getWorkers(
            @RequestHeader(value = "X-Internal-Key", required = false) String key) {
        if (!internalApiKey.equals(key)) {
            return ResponseEntity.status(403).build();
        }
        // Return worker profile info from the worker CV table or user data
        // For now return basic account-level data from assigned projects
        return ResponseEntity.ok(List.of());
    }
}
