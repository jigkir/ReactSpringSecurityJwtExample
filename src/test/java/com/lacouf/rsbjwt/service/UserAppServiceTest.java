package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.auth.UserLoginDTO;
import com.lacouf.rsbjwt.service.dto.response.user.DisciplineDto;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.user.RoleDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAppServiceTest {
    private static final String EMAIL = "user@example.com";
    private static final String RAW_PASSWORD = "Test123@";
    private static final String ENCODED_PASSWORD = "Test123@-encoded";

    @InjectMocks
    private UserAppService userAppService;

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private Authentication authentication;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldReturnTokenWhenLoginSucceeds() {
        // Arrange
        UserLoginDTO login = new UserLoginDTO("user@example.com", "Password123");

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token");

        // Act
        JWTAuthResponse response = userAppService.login(login);

        // Assert
        assert ("jwt-token").equals(response.accessToken());

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);

        verify(authenticationManager).authenticate(captor.capture());

        Authentication authenticationRequest = captor.getValue();

        assert ("user@example.com").equals(authenticationRequest.getName());
        assert ("Password123").equals(authenticationRequest.getCredentials());

        verify(jwtTokenProvider).generateToken(authentication);
    }

    @Test
    void shouldNotGenerateTokenWhenAuthenticationFails() {
        // Arrange
        UserLoginDTO login = new UserLoginDTO("user@example.com", "wrongPassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act + Assert
        assertThrows(BadCredentialsException.class, () -> userAppService.login(login));

        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    void shouldReturnUserWhenEmailExists() throws UserNotFoundException {
        // Arrange
        Credentials credentials = Credentials.builder()
                .email("student@example.com")
                .password("encodedPassword")
                .role(Role.STUDENT)
                .build();

        Student student = new Student("John", "Doe", "1234567", credentials, Discipline.COMPUTER_SCIENCE);

        student.setId(1L);

        when(userAppRepository.findByCredentialsEmail("student@example.com")).thenReturn(Optional.of(student));

        // Act
        UserResponseDto response = userAppService.getUserByEmail("student@example.com");

        // Assert
        assert (Long.valueOf(1L)).equals(response.id());
        assert ("John").equals(response.firstName());
        assert ("Doe").equals(response.lastName());
        assert ("student@example.com").equals(response.email());
        assert ("STUDENT").equals(response.role());

        verify(userAppRepository).findByCredentialsEmail("student@example.com");
    }

    @Test
    void shouldThrowUserNotFoundWhenEmailDoesNotExist() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail("unknown@example.com")).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(UserNotFoundException.class, () -> userAppService.getUserByEmail("unknown@example.com"));

        verify(userAppRepository).findByCredentialsEmail("unknown@example.com");
    }

    @Test
    void shouldReturnAllRoles() {
        // Arrange
        List<String> roles = List.of(
                "MANAGER",
                "STUDENT",
                "TEACHER",
                "EMPLOYER"
        );

        // Act
        RoleDto response = userAppService.getAllRoles();

        // Assert
        assert (roles).equals(response.roles());
    }

    @Test
    void shouldReturnAllDisciplines() {
        // Arrange
        List<String> disciplines = List.of(
                "COMPUTER_SCIENCE",
                "CIVIL_ENGINEERING",
                "ELECTRICAL_ENGINEERING",
                "MARKETING",
                "NURSING"
        );

        // Act
        DisciplineDto response = userAppService.getAllDisciplines();

        // Assert
        assert (disciplines).equals(response.disciplines());
    }

    @Test
    void shouldCreateEncodedCredentialsWhenEmailIsAvailable() throws UserAlreadyExistsException {
        // Arrange
        when(userAppRepository.findByCredentialsEmail(EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);

        // Act
        Credentials credentials = userAppService.createCredentials(EMAIL, RAW_PASSWORD, Role.STUDENT);

        // Assert
        assert (EMAIL).equals(credentials.getEmail());
        assert (ENCODED_PASSWORD).equals(credentials.getPassword());
        assert (Role.STUDENT).equals(credentials.getRole());
    }

    @Test
    void shouldThrowUserAlreadyExistsWhenEmailIsAlreadyUsed() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail(EMAIL)).thenReturn(Optional.of(new Student()));

        // Act
        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> userAppService.createCredentials(EMAIL, RAW_PASSWORD, Role.STUDENT)
        );

        // Assert
        assert ("email").equals(exception.getField());
        assert ("user already exists").equals(exception.getMessage());

        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void shouldFormatPhoneNumberWithDashes() {
        // Act
        String formattedPhoneNumber = userAppService.formatPhoneNumber("5141234567");

        // Assert
        assert ("514-123-4567").equals(formattedPhoneNumber);
    }
}