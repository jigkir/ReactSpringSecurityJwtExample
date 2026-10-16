package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.auth.UserLoginDTO;
import com.lacouf.rsbjwt.service.dto.response.user.DisciplineDto;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.user.RoleDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserAppService {
    private static final String EMAIL_FIELD = "email";
    private static final String PHONE_NUMBER_PATTERN = "^([0-9]{3})([0-9]{3})([0-9]{4})$";
    private static final String PHONE_NUMBER_FORMAT = "$1-$2-$3";

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserAppRepository userAppRepository;
    private final PasswordEncoder passwordEncoder;

    public JWTAuthResponse login(UserLoginDTO userLoginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userLoginDto.email(), userLoginDto.password()));

        return new JWTAuthResponse(jwtTokenProvider.generateToken(authentication));
    }

    // Dev Mode only (called from DevController): token for any user, no password
    public JWTAuthResponse devLoginAs(String email) throws UserNotFoundException {
        UserApp user = userAppRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);
        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, user.getAuthorities());

        return new JWTAuthResponse(jwtTokenProvider.generateToken(authentication));
    }

    public UserResponseDto getUserByEmail(String email) throws UserNotFoundException {
        UserApp user = userAppRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);

        return UserResponseDto.of(user);
    }

    // Dev Mode only (called from DevController)
    public List<UserResponseDto> getAllDevUsers() {
        return userAppRepository.findAll().stream()
                .map(UserResponseDto::of)
                .toList();
    }

    public DisciplineDto getAllDisciplines() {
        return DisciplineDto.of(List.of(Discipline.values()));
    }

    public RoleDto getAllRoles() {
        return RoleDto.of(List.of(Role.values()));
    }

    public Credentials createCredentials(String email, String rawPassword, Role role) throws UserAlreadyExistsException {
        verifyIfEmailIsAlreadyUsed(email);

        return Credentials.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .build();
    }

    public String formatPhoneNumber(String phoneNumber) {
        return phoneNumber.replaceFirst(PHONE_NUMBER_PATTERN, PHONE_NUMBER_FORMAT);
    }

    private void verifyIfEmailIsAlreadyUsed(String email) throws UserAlreadyExistsException {
        Optional<UserApp> userApp = userAppRepository.findByCredentialsEmail(email);

        if (userApp.isPresent()) {
            throw new UserAlreadyExistsException(EMAIL_FIELD);
        }
    }
}
