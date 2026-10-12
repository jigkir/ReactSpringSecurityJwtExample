package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.model.user.Teacher;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.users.TeacherRepository;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.request.signup.TeacherSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TeacherService {
    private static final String TEACHER_ID_FIELD = "teacherId";

    private final TeacherRepository teacherRepository;
    private final UserAppService userAppService;

    public TeacherService(TeacherRepository teacherRepository, UserAppService userAppService) {
        this.teacherRepository = teacherRepository;
        this.userAppService = userAppService;
    }

    public UserResponseDto save(TeacherSignUpDto teacherSignUpDto) throws UserAlreadyExistsException {
        Credentials credentials = userAppService.createCredentials(teacherSignUpDto.email(), teacherSignUpDto.password(), Role.TEACHER);

        verifyIfTeacherIdIsAlreadyUsed(teacherSignUpDto.teacherId());

        Teacher teacher = new Teacher(
                teacherSignUpDto.firstName(),
                teacherSignUpDto.lastName(),
                teacherSignUpDto.teacherId(),
                credentials,
                teacherSignUpDto.discipline()
        );

        teacherRepository.save(teacher);

        return UserResponseDto.of(teacher);
    }

    private void verifyIfTeacherIdIsAlreadyUsed(String teacherId) throws UserAlreadyExistsException {
        Optional<Teacher> teacher = teacherRepository.findByTeacherId(teacherId);

        if (teacher.isPresent()) {
            throw new UserAlreadyExistsException(TEACHER_ID_FIELD);
        }
    }
}
