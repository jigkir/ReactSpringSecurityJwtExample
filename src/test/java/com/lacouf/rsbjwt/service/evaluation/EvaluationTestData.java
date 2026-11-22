package com.lacouf.rsbjwt.service.evaluation;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.intern.*;
import com.lacouf.rsbjwt.model.evaluation.workplace.InternCapacity;
import com.lacouf.rsbjwt.model.evaluation.workplace.PreferredInternship;
import com.lacouf.rsbjwt.model.evaluation.workplace.ShiftRange;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

public final class EvaluationTestData {
    public static final long EVALUATION_ID = 40L;
    public static final String TEACHER_EMAIL = "marie.dubois@claurendeau.qc.ca";
    public static final String EMPLOYER_EMAIL = "jean@techcorp.com";
    public static final String PASSWORD = "Test123@";
    public static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 20, 14, 30);
    public static final BigDecimal HOURLY_SALARY = new BigDecimal("22.50");
    public static final BigDecimal SUPERVISION_HOURS = new BigDecimal("7.5");

    private EvaluationTestData() {
    }

    public static InternshipTracking tracking() {
        Employer employer = new Employer("Jean", "Dupont", credentials(EMPLOYER_EMAIL, Role.EMPLOYER), "Tech Corp", Discipline.COMPUTER_SCIENCE, "5141234567");
        Internship internship = new Internship("Développeur web", "Développer des applications web", "Java, React", 16, "Montréal", WorkMode.HYBRID,
                LocalDate.of(2027, 1, 11), LocalDate.of(2026, 12, 1), HOURLY_SALARY, false, employer, new AcademicSession(Season.WINTER, 2027));
        Student student = new Student("Léa", "Tremblay", "2234567", credentials("lea.tremblay@example.com", Role.STUDENT), Discipline.COMPUTER_SCIENCE, null);

        InternshipApplication application = new InternshipApplication(internship, new CV(), student);
        application.updateEmployerDecision(EmployerDecision.INTERNSHIP_OFFERED);

        InternshipTracking tracking = new InternshipTracking(new Contract(application, NOW));
        tracking.assignTeacher(new Teacher("Marie", "Dubois", "T1234", credentials(TEACHER_EMAIL, Role.TEACHER), Discipline.COMPUTER_SCIENCE));

        return tracking;
    }

    public static WorkplaceEvaluation workplaceEvaluation() {
        WorkplaceEvaluation evaluation = tracking().getWorkplaceEvaluation();
        evaluation.setId(EVALUATION_ID);

        return evaluation;
    }

    public static WorkplaceEvaluation completeWorkplaceEvaluation() {
        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, ratingsOf(WorkplaceCriterion.class, AgreementLevel.TOTALLY_AGREE), HOURLY_SALARY, null, false, List.of());

        return evaluation;
    }

    public static void answerWorkplaceEvaluation(WorkplaceEvaluation evaluation, Map<WorkplaceCriterion, AgreementLevel> ratings, BigDecimal hourlySalary,
                                                 String comments, boolean offersVariableShifts, List<ShiftRange> shiftRanges) {
        evaluation.update(ratings, SUPERVISION_HOURS, SUPERVISION_HOURS, SUPERVISION_HOURS, hourlySalary, comments,
                PreferredInternship.FIRST, InternCapacity.TWO, true, offersVariableShifts, shiftRanges, NOW);
    }

    public static EvaluationResponseDto<WorkplaceEvaluationFormDto> workplaceResponse(WorkplaceEvaluation evaluation) {
        return EvaluationResponseDto.of(evaluation, WorkplaceEvaluationFormDto.of(evaluation));
    }

    public static InternEvaluation internEvaluation() {
        InternEvaluation evaluation = tracking().getInternEvaluation();
        evaluation.setId(EVALUATION_ID);

        return evaluation;
    }

    public static InternEvaluation completeInternEvaluation() {
        InternEvaluation evaluation = internEvaluation();
        answerInternEvaluation(evaluation, ratingsOf(InternCriterion.class, AgreementLevel.TOTALLY_AGREE), "Très travaillant, avec une attitude positive.", "Développeur principal");

        return evaluation;
    }

    public static void answerInternEvaluation(InternEvaluation evaluation, Map<InternCriterion, AgreementLevel> ratings, String appreciationDetails, String supervisorJobTitle) {
        evaluation.update(ratings, Map.of(InternEvaluationSection.WORK_QUALITY, "Teste maintenant son code avant de le remettre."),
                OverallAppreciation.EXCEEDS_EXPECTATIONS, appreciationDetails, true, SUPERVISION_HOURS, NextInternshipInterest.YES,
                "Oui, sa formation était suffisante.", supervisorJobTitle, NOW);
    }

    public static EvaluationResponseDto<InternEvaluationFormDto> internResponse(InternEvaluation evaluation) {
        return EvaluationResponseDto.of(evaluation, InternEvaluationFormDto.of(evaluation));
    }

    public static <C extends Enum<C>> Map<C, AgreementLevel> ratingsOf(Class<C> criteria, AgreementLevel level) {
        Map<C, AgreementLevel> ratings = new EnumMap<>(criteria);
        EnumSet.allOf(criteria).forEach(criterion -> ratings.put(criterion, level));

        return ratings;
    }

    private static Credentials credentials(String email, Role role) {
        return Credentials.builder().email(email).password("Test123@-encoded").role(role).build();
    }
}
