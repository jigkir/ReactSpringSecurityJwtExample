package com.lacouf.rsbjwt.service.dto.response.evaluation;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EvaluationResponseDto<F>(
        long id,
        String studentName,
        Discipline studentDiscipline,
        String companyName,
        String supervisorName,
        String internshipTitle,
        LocalDate internshipStartDate,
        LocalDate internshipEndDate,
        F form,
        boolean complete,
        LocalDateTime updatedAt,
        LocalDateTime signedAt
) {
    public static <F> EvaluationResponseDto<F> of(Evaluation evaluation, F form) {
        InternshipTracking tracking = evaluation.getTracking();
        Student student = tracking.getStudent();
        Internship internship = tracking.getInternship();
        Employer employer = internship.getPostedBy();

        return new EvaluationResponseDto<>(
                evaluation.getId(),
                student.getFullName(),
                student.getDiscipline(),
                employer.getCompanyName(),
                employer.getFullName(),
                internship.getTitle(),
                internship.getStartDate(),
                internship.getEndDate(),
                form,
                evaluation.isComplete(),
                evaluation.getUpdatedAt(),
                evaluation.getSignedAt()
        );
    }
}
