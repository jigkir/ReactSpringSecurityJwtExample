package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.repository.ManagerRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.response.CVDto;
import org.junit.jupiter.api.BeforeAll;
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

    private static CV cv;

    @BeforeAll
    public static void setUp() {
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
}
