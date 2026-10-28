package com.lacouf.rsbjwt.presentation.users;

import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.dto.request.document.student.cv.CvRejectionDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRejectionDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.ManagerCvResponseDto;
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
    public ResponseEntity<List<ManagerCvResponseDto>> getAllVisibleCvs() {
        return ResponseEntity.ok(managerService.getAllVisibleCvs());
    }

    @GetMapping("/cvs/{cvId}")
    public ResponseEntity<ManagerCvResponseDto> getCv(@PathVariable long cvId) throws DocumentNotFoundException {
        return ResponseEntity.ok(managerService.getCv(cvId));
    }

    @GetMapping("/cvs/{cvId}/file")
    public ResponseEntity<DocumentFileResponseDto> getCvFile(@PathVariable long cvId) throws DocumentNotFoundException {
        return ResponseEntity.ok(managerService.getCvFile(cvId));
    }

    @PutMapping("/cvs/{cvId}/approve")
    public ResponseEntity<ManagerCvResponseDto> approveCv(@PathVariable long cvId) throws DocumentNotFoundException {
        return ResponseEntity.ok(managerService.approveCv(cvId));
    }

    @PutMapping("/cvs/{cvId}/reject")
    public ResponseEntity<ManagerCvResponseDto> rejectCv(@PathVariable long cvId, @Valid @RequestBody CvRejectionDto rejection) throws DocumentNotFoundException {
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

    @PutMapping("/internships/{internshipId}")
    public ResponseEntity<InternshipResponseDto> updateInternship(@PathVariable long internshipId, @Valid @RequestBody InternshipRequestDto internshipRequestDto) throws InternshipNotFoundException, InvalidCompensationException, InvalidInternshipDateException {
        return ResponseEntity.ok(managerService.updateInternship(internshipId, internshipRequestDto));
    }
}