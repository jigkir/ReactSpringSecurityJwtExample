package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
        assert (Discipline.COMPUTER_SCIENCE).equals(response.discipline());

        verify(userAppRepository).findByCredentialsEmail("student@example.com");
    }

    @Test
    void shouldReturnTeacherDisciplineWhenGettingUserByEmail() throws UserNotFoundException {
        // Arrange
        Teacher teacher = new Teacher("Teach", "Er", "12345",
                Credentials.builder().email("teacher@example.com").password("pw").role(Role.TEACHER).build(),
                Discipline.MARKETING);
        teacher.setId(3L);

        when(userAppRepository.findByCredentialsEmail("teacher@example.com")).thenReturn(Optional.of(teacher));

        // Act
        UserResponseDto response = userAppService.getUserByEmail("teacher@example.com");

        // Assert
        assert ("TEACHER").equals(response.role());
        assert (Discipline.MARKETING).equals(response.discipline());
    }

    @Test
    void shouldReturnEmployerDisciplineWhenGettingUserByEmail() throws UserNotFoundException {
        // Arrange
        Employer employer = new Employer("Emp", "Loyer",
                Credentials.builder().email("employer@example.com").password("pw").role(Role.EMPLOYER).build(),
                "Acme", Discipline.CIVIL_ENGINEERING, "514-123-4567");
        employer.setId(4L);

        when(userAppRepository.findByCredentialsEmail("employer@example.com")).thenReturn(Optional.of(employer));

        // Act
        UserResponseDto response = userAppService.getUserByEmail("employer@example.com");

        // Assert
        assert ("EMPLOYER").equals(response.role());
        assert (Discipline.CIVIL_ENGINEERING).equals(response.discipline());
    }

    @Test
    void shouldReturnNullDisciplineWhenUserIsManager() throws UserNotFoundException {
        // Arrange
        Manager manager = new Manager("Jane", "Doe",
                Credentials.builder().email("manager@example.com").password("pw").role(Role.MANAGER).build(),
                "514-123-4567");
        manager.setId(2L);

        when(userAppRepository.findByCredentialsEmail("manager@example.com")).thenReturn(Optional.of(manager));

        // Act
        UserResponseDto response = userAppService.getUserByEmail("manager@example.com");

        // Assert
        assert response.discipline() == null;
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

    // ==========================================
    // Dev Mode Tests
    // ==========================================

    @Test
    void shouldReturnTokenWhenDevLoginAsExistingUser() throws UserNotFoundException {
        // Arrange
        Credentials credentials = Credentials.builder()
                .email("student@example.com")
                .password("encodedPassword")
                .role(Role.STUDENT)
                .build();

        Student student = new Student("John", "Doe", "1234567", credentials, Discipline.COMPUTER_SCIENCE);

        when(userAppRepository.findByCredentialsEmail("student@example.com")).thenReturn(Optional.of(student));
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("dev-jwt-token");

        // Act
        JWTAuthResponse response = userAppService.devLoginAs("student@example.com");

        // Assert
        assert ("dev-jwt-token").equals(response.accessToken());
        assert ("BEARER").equals(response.tokenType());

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);
        verify(jwtTokenProvider).generateToken(captor.capture());

        Authentication generatedFor = captor.getValue();

        assert ("student@example.com").equals(generatedFor.getName());
        assert generatedFor.getCredentials() == null;
        assert generatedFor.getAuthorities().contains(new SimpleGrantedAuthority("STUDENT"));
    }

    @Test
    void shouldNotRequirePasswordWhenDevLoginAs() throws UserNotFoundException {
        // Arrange
        Credentials credentials = Credentials.builder()
                .email("manager@example.com")
                .password("encodedPassword")
                .role(Role.MANAGER)
                .build();

        Manager manager = new Manager("Jane", "Doe", credentials, "514-123-4567");

        when(userAppRepository.findByCredentialsEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("dev-jwt-token");

        // Act
        userAppService.devLoginAs("manager@example.com");

        // Assert
        verifyNoInteractions(authenticationManager, passwordEncoder);
    }

    @Test
    void shouldThrowUserNotFoundWhenDevLoginAsUnknownEmail() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail("unknown@example.com")).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(UserNotFoundException.class, () -> userAppService.devLoginAs("unknown@example.com"));

        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    void shouldReturnAllDevUsers() {
        // Arrange
        Student student = new Student("John", "Doe", "1234567",
                Credentials.builder().email("student@example.com").password("pw").role(Role.STUDENT).build(),
                Discipline.COMPUTER_SCIENCE);
        student.setId(1L);

        Manager manager = new Manager("Jane", "Doe",
                Credentials.builder().email("manager@example.com").password("pw").role(Role.MANAGER).build(),
                "514-123-4567");
        manager.setId(2L);

        when(userAppRepository.findAll()).thenReturn(List.of(student, manager));

        // Act
        List<UserResponseDto> result = userAppService.getAllDevUsers();

        // Assert
        assert (Integer.valueOf(2)).equals(result.size());
        assert ("student@example.com").equals(result.get(0).email());
        assert ("STUDENT").equals(result.get(0).role());
        assert (Discipline.COMPUTER_SCIENCE).equals(result.get(0).discipline());
        assert ("manager@example.com").equals(result.get(1).email());
        assert ("MANAGER").equals(result.get(1).role());
        assert result.get(1).discipline() == null;
    }

    @Test
    void shouldReturnEmptyListWhenNoDevUsers() {
        // Arrange
        when(userAppRepository.findAll()).thenReturn(List.of());

        // Act
        List<UserResponseDto> result = userAppService.getAllDevUsers();

        // Assert
        assert result.isEmpty();
    }
}