package com.lacouf.rsbjwt.presentation.users;

import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVUsedInApplicationException;
import com.lacouf.rsbjwt.exception.internship.*;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.StudentAccessResponseDto;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.dto.request.document.student.cv.CvRejectionDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRejectionDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.users.AccountAccessService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    private final ManagerService managerService;
    private final AccountAccessService accountAccessService;

    public ManagerController(ManagerService managerService, AccountAccessService accountAccessService) {
        this.managerService = managerService;
        this.accountAccessService = accountAccessService;
    }

    @GetMapping("/cvs")
    public ResponseEntity<List<ManagerCvResponseDto>> getVisibleCvs(@RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(managerService.getVisibleCvs(sessionId));
    }

    @GetMapping("/cvs/pending")
    public ResponseEntity<List<ManagerCvResponseDto>> getPendingCvs() {
        return ResponseEntity.ok(managerService.getPendingCvs());
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
    public ResponseEntity<ManagerCvResponseDto> rejectCv(@PathVariable long cvId, @Valid @RequestBody CvRejectionDto rejection) throws DocumentNotFoundException, CVUsedInApplicationException {
        return ResponseEntity.ok(managerService.rejectCv(cvId, rejection.comment()));
    }

    @GetMapping("/internships")
    public ResponseEntity<List<InternshipResponseDto>> getAllInternships(@RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(managerService.getAllInternships(sessionId));
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
    public ResponseEntity<InternshipResponseDto> approveInternship(@PathVariable long internshipId) throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        return ResponseEntity.ok(managerService.approveInternship(internshipId));
    }

    @PutMapping("/internships/{internshipId}/reject")
    public ResponseEntity<InternshipResponseDto> rejectInternship(@PathVariable long internshipId, @Valid @RequestBody InternshipRejectionDto rejection) throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        return ResponseEntity.ok(managerService.rejectInternship(internshipId, rejection.comment()));
    }

    @PutMapping("/internships/{internshipId}")
    public ResponseEntity<InternshipResponseDto> updateInternship(@PathVariable long internshipId, @Valid @RequestBody InternshipRequestDto internshipRequestDto) throws InternshipNotFoundException, InvalidCompensationException, InvalidInternshipDateException, InternshipStartDateOutsideTargetSessionException, PastSessionInternshipNotEditableException {
        return ResponseEntity.ok(managerService.updateInternship(internshipId, internshipRequestDto));
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentAccessResponseDto>> getStudentAccesses() {
        return ResponseEntity.ok(accountAccessService.getStudentAccesses());
    }

    @GetMapping("/students/expired")
    public ResponseEntity<List<StudentAccessResponseDto>> getExpiredStudentAccesses() {
        return ResponseEntity.ok(accountAccessService.getExpiredStudentAccesses());
    }

    @PutMapping("/students/{studentId}/reactivate")
    public ResponseEntity<StudentAccessResponseDto> reactivateStudentAccess(@PathVariable long studentId) throws UserNotFoundException {
        return ResponseEntity.ok(accountAccessService.reactivateStudentAccess(studentId));
    }

    @PutMapping("/students/{studentId}/deny")
    public ResponseEntity<StudentAccessResponseDto> denyStudentAccess(@PathVariable long studentId) throws UserNotFoundException {
        return ResponseEntity.ok(accountAccessService.denyStudentAccess(studentId));
    }

    @GetMapping("/contracts")
    public ResponseEntity<List<ContractResponseDto>> getContracts(@RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(managerService.getContracts(sessionId));
    }
}