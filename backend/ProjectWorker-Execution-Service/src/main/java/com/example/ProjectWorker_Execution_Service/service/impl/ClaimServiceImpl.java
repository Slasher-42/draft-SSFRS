package com.example.ProjectWorker_Execution_Service.service.impl;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.GpsDirectory;
import com.example.ProjectWorker_Execution_Service.dto.ClaimResponse;
import com.example.ProjectWorker_Execution_Service.dto.WorkerClaimResponseRequest;
import com.example.ProjectWorker_Execution_Service.exception.ForbiddenException;
import com.example.ProjectWorker_Execution_Service.exception.ResourceNotFoundException;
import com.example.ProjectWorker_Execution_Service.kafka.ExecutionEventPublisher;
import com.example.ProjectWorker_Execution_Service.model.Claim;
import com.example.ProjectWorker_Execution_Service.model.Project;
import com.example.ProjectWorker_Execution_Service.model.ProjectStatus;
import com.example.ProjectWorker_Execution_Service.repository.ClaimRepository;
import com.example.ProjectWorker_Execution_Service.repository.ProjectRepository;
import com.example.ProjectWorker_Execution_Service.security.UserPrincipal;
import com.example.ProjectWorker_Execution_Service.service.ClaimService;
import com.example.ProjectWorker_Execution_Service.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final ProjectRepository projectRepository;
    private final S3UploadService s3UploadService;
    private final ExecutionEventPublisher eventPublisher;

    @Override
    @Transactional
    public ClaimResponse fileClaim(String projectId, String description,
                                    List<MultipartFile> proofDocuments,
                                    UserPrincipal principal) {
        if (!"PROVIDER".equals(principal.getRole())) {
            throw new ForbiddenException("Only project providers can file claims.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found."));

        if (!project.getProviderId().equals(principal.getUserId())) {
            throw new ForbiddenException("You do not own this project.");
        }

        if (project.getStatus() != ProjectStatus.FAILED) {
            throw new IllegalArgumentException("Claims can only be filed for projects marked as Failed.");
        }

        if (project.getAssignedWorkerId() == null) {
            throw new IllegalArgumentException("No worker was assigned to this project.");
        }

        if (claimRepository.findByProjectId(projectId).isPresent()) {
            throw new IllegalArgumentException("A claim has already been filed for this project.");
        }

        List<String> docKeys = new ArrayList<>();
        String geotagKey = null;
        Double lat = null;
        Double lon = null;
        String photoTimestamp = null;

        if (proofDocuments != null) {
            for (MultipartFile file : proofDocuments) {
                if (file.isEmpty()) continue;
                try {
                    String key = s3UploadService.uploadFile(file, "claim-documents");
                    docKeys.add(key);

                    // Try EXIF extraction from image files
                    String ct = file.getContentType();
                    if (ct != null && (ct.startsWith("image/jpeg") || ct.startsWith("image/jpg"))) {
                        byte[] bytes = file.getBytes();
                        GpsResult gps = extractGps(bytes);
                        if (gps != null && geotagKey == null) {
                            geotagKey = key;
                            lat = gps.lat;
                            lon = gps.lon;
                            photoTimestamp = gps.timestamp;
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload proof document.");
                }
            }
        }

        Claim claim = Claim.builder()
                .projectId(projectId)
                .providerId(principal.getUserId())
                .workerId(project.getAssignedWorkerId())
                .description(description)
                .proofDocumentKeys(docKeys)
                .geotagPhotoKey(geotagKey)
                .extractedLat(lat)
                .extractedLon(lon)
                .extractedPhotoTimestamp(photoTimestamp)
                .build();

        claimRepository.save(claim);
        eventPublisher.publishClaimFiled(claim.getId(), projectId, project.getAssignedWorkerId());

        return toResponse(claim);
    }

    @Override
    public List<ClaimResponse> getMyClaims(UserPrincipal principal) {
        return claimRepository.findAllByProviderIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ClaimResponse> getClaimsAgainstMe(UserPrincipal principal) {
        return claimRepository.findAllByWorkerIdOrderByCreatedAtDesc(principal.getUserId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ClaimResponse getClaimById(String claimId, UserPrincipal principal) {
        Claim claim = findClaim(claimId);
        boolean isProvider = claim.getProviderId().equals(principal.getUserId());
        boolean isWorker = claim.getWorkerId().equals(principal.getUserId());
        if (!isProvider && !isWorker && !"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Access denied.");
        }
        return toResponse(claim);
    }

    @Override
    @Transactional
    public ClaimResponse respondToClaim(String claimId, WorkerClaimResponseRequest request,
                                         UserPrincipal principal) {
        Claim claim = findClaim(claimId);
        if (!claim.getWorkerId().equals(principal.getUserId())) {
            throw new ForbiddenException("You are not the worker on this claim.");
        }
        claim.setWorkerResponse(request.getResponse());
        claimRepository.save(claim);
        eventPublisher.publishWorkerClaimResponse(claimId, principal.getUserId());
        return toResponse(claim);
    }

    private Claim findClaim(String claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));
    }

    private ClaimResponse toResponse(Claim c) {
        List<String> docUrls = c.getProofDocumentKeys().stream()
                .map(s3UploadService::generatePresignedUrl)
                .collect(Collectors.toList());

        return ClaimResponse.builder()
                .id(c.getId())
                .projectId(c.getProjectId())
                .providerId(c.getProviderId())
                .workerId(c.getWorkerId())
                .description(c.getDescription())
                .status(c.getStatus().name())
                .proofDocumentUrls(docUrls)
                .geotagPhotoUrl(s3UploadService.generatePresignedUrl(c.getGeotagPhotoKey()))
                .extractedLat(c.getExtractedLat())
                .extractedLon(c.getExtractedLon())
                .extractedPhotoTimestamp(c.getExtractedPhotoTimestamp())
                .workerResponse(c.getWorkerResponse())
                .aiMediationReport(c.getAiMediationReport())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private GpsResult extractGps(byte[] imageBytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(imageBytes));
            Collection<GpsDirectory> gpsDirs = metadata.getDirectoriesOfType(GpsDirectory.class);
            for (GpsDirectory gpsDir : gpsDirs) {
                com.drew.lang.GeoLocation geo = gpsDir.getGeoLocation();
                if (geo != null && !geo.isZero()) {
                    String timestamp = null;
                    java.util.Date date = gpsDir.getGpsDate();
                    if (date != null) timestamp = date.toString();
                    return new GpsResult(geo.getLatitude(), geo.getLongitude(), timestamp);
                }
            }
        } catch (Exception ignored) {
            // no EXIF or not an image — skip silently
        }
        return null;
    }

    private record GpsResult(double lat, double lon, String timestamp) {}
}
