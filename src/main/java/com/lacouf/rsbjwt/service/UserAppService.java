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
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserAppService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserAppRepository userAppRepository;
    private final EmprunteurRepository emprunteurRepository;
    private final PreposeRepository preposeRepository;
    private final ManagerRepository managerRepository;

    public String authenticateUser(LoginDTO loginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword()));
        final String token = jwtTokenProvider.generateToken(authentication);
        System.out.println("JWT Token " + token);
        return token;
    }

    public UserDTO getMe(String token) {
        token = token.startsWith("Bearer") ? token.substring(7) : token;
        String email = jwtTokenProvider.getEmailFromJWT(token);
        UserApp user = userAppRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);
        return switch(user.getRole()){
            case EMPRUNTEUR -> getEmprunteurDto(user.getId());
            case PREPOSE -> getPreposeDto(user.getId());
            case MANAGER -> getManagerDto(user.getId());
            case STUDENT -> null;
            case EMPLOYER -> null;
            case TEACHER -> null;
        };
    }

    private ManagerDto getManagerDto(Long id) {
        final Optional<Manager> managerOptional = managerRepository.findById(id);
        return managerOptional.isPresent() ?
                ManagerDto.create(managerOptional.get()) :
                ManagerDto.empty();
    }

    private PreposeDto getPreposeDto(Long id) {
        final Optional<Prepose> preposeOptional = preposeRepository.findById(id);
        return preposeOptional.isPresent() ?
                PreposeDto.create(preposeOptional.get()) :
                PreposeDto.empty();
    }

    private EmprunteurDto getEmprunteurDto(Long id) {
        final Optional<Emprunteur> emprunteurOptional = emprunteurRepository.findById(id);
        return emprunteurOptional.isPresent() ?
                EmprunteurDto.create(emprunteurOptional.get()) :
                EmprunteurDto.empty();
    }

    public DisciplineDto getAllDisciplines() {
        return DisciplineDto.of(List.of(Discipline.values()));
    }

    public RoleDto getAllRoles() {
        return RoleDto.of(List.of(Role.values()));
    }
}
