package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.dto.*;
import com.lacouf.rsbjwt.security.JwtTokenProvider;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAppService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserAppRepository userAppRepository;

    public JWTAuthResponse login(UserLoginDTO userLoginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userLoginDto.email(), userLoginDto.password()));

        return new JWTAuthResponse(jwtTokenProvider.generateToken(authentication));
    }

    public UserResponseDto getUserByEmail(String email) throws UserNotFoundException {
        UserApp user = userAppRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);

        return UserResponseDto.of(user);
    }

    public DisciplineDto getAllDisciplines() {
        return DisciplineDto.of(List.of(Discipline.values()));
    }

    public RoleDto getAllRoles() {
        return RoleDto.of(List.of(Role.values()));
    }
}
