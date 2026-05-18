package com.example.ProjectWorker_Execution_Service.service.impl;

import com.example.ProjectWorker_Execution_Service.dto.InterviewRequest;
import com.example.ProjectWorker_Execution_Service.dto.InterviewResponse;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.model.Interview;
import com.example.ProjectWorker_Execution_Service.model.InterviewStatus;
import com.example.ProjectWorker_Execution_Service.repository.InterviewRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository interviewRepository;

    @Override
    @Transactional
    public InterviewResponse submitInterview(InterviewRequest request, UserPrincipal principal) {
        if (!"WORKER".equals(principal.getRole())) {
            throw new ForbiddenException("Only workers can submit interviews.");
        }

        Interview interview = interviewRepository.findByWorkerId(principal.getUserId())
                .orElse(Interview.builder()
                        .workerId(principal.getUserId())
                        .workerEmail(principal.getEmail())
                        .workerName(extractName(principal.getEmail()))
                        .build());

        interview.setAnswersJson(request.getAnswersJson());
        interview.setStatus(InterviewStatus.SUBMITTED);
        interviewRepository.save(interview);
        return toResponse(interview);
    }

    @Override
    public InterviewResponse getMyInterview(UserPrincipal principal) {
        Interview interview = interviewRepository.findByWorkerId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("No interview found. Submit your interview first."));
        return toResponse(interview);
    }

    @Override
    public List<InterviewResponse> getAllInterviews() {
        return interviewRepository.findAllByOrderBySubmittedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InterviewResponse scoreInterview(String interviewId, double score) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + interviewId));
        interview.setInterviewScore(score);
        interview.setStatus(InterviewStatus.SCORED);
        interview.setReviewedAt(LocalDateTime.now());
        interviewRepository.save(interview);
        return toResponse(interview);
    }

    private InterviewResponse toResponse(Interview i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .workerId(i.getWorkerId())
                .workerName(i.getWorkerName())
                .workerEmail(i.getWorkerEmail())
                .answersJson(i.getAnswersJson())
                .interviewScore(i.getInterviewScore())
                .status(i.getStatus().name())
                .submittedAt(i.getSubmittedAt())
                .reviewedAt(i.getReviewedAt())
                .build();
    }

    private String extractName(String email) {
        if (email == null) return "Worker";
        return email.substring(0, email.indexOf('@')).replace(".", " ");
    }
}
