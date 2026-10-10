package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.request.cv.CvRejectionDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRejectionDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/cvs")
    public ResponseEntity<List<ManagerCvResponseDto>> getAllPublicCvs() {
        return ResponseEntity.ok(managerService.getAllPublicCvs());
    }

    @GetMapping("/cvs/{cvId}")
    public ResponseEntity<ManagerCvResponseDto> getCv(@PathVariable long cvId) throws CvNotFoundException {
        return ResponseEntity.ok(managerService.getCv(cvId));
    }

    @GetMapping("/cvs/{cvId}/file")
    public ResponseEntity<CvFileResponseDto> getCvFile(@PathVariable long cvId) throws CvNotFoundException {
        return ResponseEntity.ok(managerService.getCvFile(cvId));
    }

    @PutMapping("/cvs/{cvId}/approve")
    public ResponseEntity<ManagerCvResponseDto> approveCv(@PathVariable long cvId) throws CvNotFoundException {
        return ResponseEntity.ok(managerService.approveCv(cvId));
    }

    @PutMapping("/cvs/{cvId}/reject")
    public ResponseEntity<ManagerCvResponseDto> rejectCv(@PathVariable long cvId, @Valid @RequestBody CvRejectionDto rejection) throws CvNotFoundException {
        return ResponseEntity.ok(managerService.rejectCv(cvId, rejection.comment()));
    }

    @GetMapping("/internships")
    public ResponseEntity<List<InternshipResponseDto>> getAllInternships() {
        return ResponseEntity.ok(managerService.getAllInternships());
    }

    @GetMapping("/internships/pending")
    public ResponseEntity<List<InternshipResponseDto>> getPendingInternships() {
        return ResponseEntity.ok(managerService.getPendingInternships());
    }

    @GetMapping("/internships/{internshipId}")
    public ResponseEntity<InternshipResponseDto> getInternship(@PathVariable long internshipId) throws InternshipNotFoundException {
        return ResponseEntity.ok(managerService.getInternshipById(internshipId));
    }

    @PutMapping("/internships/{internshipId}/approve")
    public ResponseEntity<InternshipResponseDto> approveInternship(@PathVariable long internshipId) throws InternshipNotFoundException {
        return ResponseEntity.ok(managerService.approveInternship(internshipId));
    }

    @PutMapping("/internships/{internshipId}/reject")
    public ResponseEntity<InternshipResponseDto> rejectInternship(@PathVariable long internshipId, @Valid @RequestBody InternshipRejectionDto rejection) throws InternshipNotFoundException {
        return ResponseEntity.ok(managerService.rejectInternship(internshipId, rejection.comment()));
    }
}