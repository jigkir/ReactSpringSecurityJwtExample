package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.repository.ManagerRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.response.CVDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ManagerServiceTest {

    @InjectMocks
    private ManagerService managerService;

    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Manager> managerArgumentCaptor;

    private CV cv;

    @BeforeEach
    void setUp() {
        cv = new CV("pdf".getBytes(), CvVisibility.VISIBLE, CVSharingScope.PUBLIC, CvPriority.MAIN, "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0));
        cv.setId(1L);
    }

    @Test
    void shouldSaveManager() throws UserAlreadyExistsException {
        // Arrange
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

        when(managerRepository.save(any(Manager.class)))
                .thenAnswer(answer((Manager manager) -> {
                    manager.setId(1L);
                    return manager;
                }));

        // Act
        managerService.save("First Name", "Last Name", "manager@example.com", "Test123@", "5141234567");

        // Assert
        verify(managerRepository).save(managerArgumentCaptor.capture());

        Manager savedManager = managerArgumentCaptor.getValue();
        assert(savedManager.getFirstName()).equals("First Name");
        assert(savedManager.getLastName()).equals("Last Name");
        assert(savedManager.getEmail()).equals("manager@example.com");
        assert(savedManager.getPassword()).equals("Test123@-encoded");
        assert(savedManager.getRole()).equals(Role.MANAGER);
        assert(savedManager.getPhoneNumber()).equals("514-123-4567");
    }

    @Test
    void shouldThrowUserAlreadyExistsWhenEmailAlreadyUsed() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail("manager@example.com")).thenReturn(Optional.of(new Manager()));

        // Act
        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> managerService.save("First Name", "Last Name", "manager@example.com", "Test123@", "5141234567")
        );

        // Assert
        assert("email").equals(exception.getField());
        assert("user already exists").equals(exception.getMessage());

        verify(managerRepository, never()).save(any(Manager.class));
    }

    @Test
    void shouldReturnPendingPublicCvs() {
        when(cvRepository.findByStatusAndSharingScope(CvStatus.PENDING, CVSharingScope.PUBLIC)).thenReturn(List.of(cv));

        // Act
        List<CVDto> result = managerService.getPendingPublicCvs();

        // Assert
        assert(Integer.valueOf(1)).equals(result.size());
        assert(Long.valueOf(1L)).equals(result.getFirst().id());
        assert("cv.pdf").equals(result.getFirst().fileName());
        assert(CVSharingScope.PUBLIC).equals(result.getFirst().sharingScope());

        verify(cvRepository).findByStatusAndSharingScope(CvStatus.PENDING, CVSharingScope.PUBLIC);
    }

    @Test
    void shouldApproveCv() throws CvNotFoundException, CvAlreadyReviewedException {
        // Arrange
        when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

        // Act
        managerService.approveCv(1L);

        // Assert
        assert(CvStatus.APPROVED).equals(cv.getStatus());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldRejectCv() throws CvNotFoundException, CvAlreadyReviewedException {
        // Arrange
        when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

        // Act
        managerService.rejectCv(1L);

        // Assert
        assert(CvStatus.REJECTED).equals(cv.getStatus());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCvNotFoundWhenApprovingUnknownCv() {
        // Arrange
        when(cvRepository.findById(99L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> managerService.approveCv(99L));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldThrowCvNotFoundWhenRejectingUnknownCv() {
        // Arrange
        when(cvRepository.findById(99L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> managerService.rejectCv(99L));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldReturnApprovedStatusInDtoWhenCvIsApproved() throws Exception {
        // Arrange
        when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

        // Act
        CVDto result = managerService.approveCv(1L);

        // Assert
        assert(CvStatus.APPROVED).equals(result.status());
    }

    @Test
    void shouldReturnRejectedStatusInDtoWhenCvIsRejected() throws Exception {
        // Arrange
        when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

        // Act
        CVDto result = managerService.rejectCv(1L);

        // Assert
        assert(CvStatus.REJECTED).equals(result.status());
    }

    @Test
    void shouldThrowCvAlreadyReviewedWhenApprovingAlreadyApprovedCv() {
        // Arrange
        cv.setStatus(CvStatus.APPROVED);
        when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

        // Act
        CvAlreadyReviewedException exception = assertThrows(CvAlreadyReviewedException.class, () -> managerService.approveCv(1L));

        // Assert
        assert("The CV with ID 1 has already been reviewed.").equals(exception.getMessage());

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldThrowCvAlreadyReviewedWhenRejectingAlreadyRejectedCv() {
        // Arrange
        cv.setStatus(CvStatus.REJECTED);
        when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

        // Act + Assert
        assertThrows(CvAlreadyReviewedException.class, () -> managerService.rejectCv(1L));

        verify(cvRepository, never()).save(any(CV.class));
    }
}
