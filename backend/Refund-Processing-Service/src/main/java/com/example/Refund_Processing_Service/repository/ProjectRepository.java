package com.example.Refund_Processing_Service.repository;

import com.example.Refund_Processing_Service.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, String> {
}
