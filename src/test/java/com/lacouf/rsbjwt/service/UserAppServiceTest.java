package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.service.dto.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.UserLoginDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAppServiceTest {

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

    @Test
    void shouldReturnTokenWhenLoginSucceeds() {
        // Arrange
        UserLoginDTO login = new UserLoginDTO("user@example.com", "Password123");

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token");

        // Act
        JWTAuthResponse response = userAppService.login(login);

        // Assert
        assert("jwt-token").equals(response.accessToken());

        ArgumentCaptor<Authentication> captor = ArgumentCaptor.forClass(Authentication.class);

        verify(authenticationManager).authenticate(captor.capture());

        Authentication authenticationRequest = captor.getValue();

        assert("user@example.com").equals(authenticationRequest.getName());
        assert("Password123").equals(authenticationRequest.getCredentials());

        verify(jwtTokenProvider).generateToken(authentication);
    }

    @Test
    void shouldNotGenerateTokenWhenAuthenticationFails() {
        UserLoginDTO login = new UserLoginDTO("user@example.com", "wrongPassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act + Assert
        assertThrows(BadCredentialsException.class, () -> userAppService.login(login));

        verifyNoInteractions(jwtTokenProvider);
    }
}