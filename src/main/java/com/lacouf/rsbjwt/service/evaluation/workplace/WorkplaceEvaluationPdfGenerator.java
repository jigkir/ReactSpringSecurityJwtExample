package com.lacouf.rsbjwt.service.evaluation.workplace;

import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.service.pdf.PdfTexts;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Locale;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationPdfSections.*;
import static com.lacouf.rsbjwt.service.pdf.PdfLayout.*;

@Component
public class WorkplaceEvaluationPdfGenerator {
    private static final String MESSAGE_PREFIX = "workplaceEvaluation.pdf.";
    private static final String PREFERRED_INTERNSHIP_KEY_PREFIX = "preferredInternship.";
    private static final String INTERN_CAPACITY_KEY_PREFIX = "internCapacity.";

    private final MessageSource messageSource;

    public WorkplaceEvaluationPdfGenerator(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public byte[] generate(WorkplaceEvaluation evaluation, DocumentLanguage language) {
        PdfTexts texts = new PdfTexts(messageSource, language.getLocale(), MESSAGE_PREFIX);
        InternshipTracking tracking = evaluation.getTracking();

        return write(texts, document -> {
            document.add(evaluationHeader(tracking.getSession(), texts));
            writeCompany(document, tracking.getInternship(), texts);
            writeIntern(document, tracking, texts);
            writeRatings(document, evaluation, texts);
            writeComments(document, evaluation, texts);
            writeGeneralObservations(document, evaluation, texts);
            document.add(signature(texts.get("signerRole"), tracking.getTeacher().getFullName(), evaluation.getSignedAt(), texts));
        });
    }

    private void writeCompany(Document document, Internship internship, PdfTexts texts) {
        Employer employer = internship.getPostedBy();
        Table company = detailsTable();

        addDetail(company, texts.get("companyName"), employer.getCompanyName());
        addDetail(company, texts.get("contactName"), employer.getFullName());
        addDetail(company, texts.get("email"), employer.getEmail());
        addDetail(company, texts.get("phone"), employer.getPhoneNumber());
        addDetail(company, texts.get("location"), internship.getLocation());

        document.add(heading(texts.get("companyHeading")));
        document.add(company);
    }

    private void writeIntern(Document document, InternshipTracking tracking, PdfTexts texts) {
        Internship internship = tracking.getInternship();
        Locale locale = texts.locale();
        Table intern = detailsTable();

        addDetail(intern, texts.get("internName"), tracking.getStudent().getFullName());
        addDetail(intern, texts.get("internship"), internship.getTitle());
        addDetail(intern, texts.get("period"), texts.shared("periodValue", formatDate(internship.getStartDate(), locale), formatDate(internship.getEndDate(), locale)));

        document.add(heading(texts.get("internHeading")));
        document.add(intern);
    }

    private void writeRatings(Document document, WorkplaceEvaluation evaluation, PdfTexts texts) {
        Table supervisionAndSalary = detailsTable();

        addDetail(supervisionAndSalary, texts.get("firstMonthSupervisionHours"), numberAnswer(evaluation.getFirstMonthSupervisionHours(), texts));
        addDetail(supervisionAndSalary, texts.get("secondMonthSupervisionHours"), numberAnswer(evaluation.getSecondMonthSupervisionHours(), texts));
        addDetail(supervisionAndSalary, texts.get("thirdMonthSupervisionHours"), numberAnswer(evaluation.getThirdMonthSupervisionHours(), texts));
        addDetail(supervisionAndSalary, texts.get("hourlySalary"), moneyAnswer(evaluation.getHourlySalary(), texts));

        document.add(heading(texts.get("evaluationHeading")));
        document.add(ratingGrid(EnumSet.allOf(WorkplaceCriterion.class), evaluation.getRatings(), texts));
        document.add(new Paragraph(texts.get("disagreementNote")).setFontSize(SMALL_FONT_SIZE).setFontColor(MUTED_TEXT_COLOR));
        document.add(subheading(texts.get("supervisionAndSalaryHeading")));
        document.add(supervisionAndSalary);
    }

    private void writeComments(Document document, WorkplaceEvaluation evaluation, PdfTexts texts) {
        document.add(heading(texts.get("commentsHeading")));
        document.add(new Paragraph(textAnswer(evaluation.getComments(), texts)));
    }

    private void writeGeneralObservations(Document document, WorkplaceEvaluation evaluation, PdfTexts texts) {
        Table observations = detailsTable();

        addDetail(observations, texts.get("preferredInternship"), answerLabel(PREFERRED_INTERNSHIP_KEY_PREFIX, evaluation.getPreferredInternship(), texts));
        addDetail(observations, texts.get("internCapacity"), answerLabel(INTERN_CAPACITY_KEY_PREFIX, evaluation.getInternCapacity(), texts));
        addDetail(observations, texts.get("welcomesSameInternAgain"), yesNoAnswer(evaluation.getWelcomesSameInternAgain(), texts));
        addDetail(observations, texts.get("offersVariableShifts"), yesNoAnswer(evaluation.getOffersVariableShifts(), texts));
        evaluation.getShiftRanges().forEach(shift -> addDetail(observations, texts.get("shift"), texts.get("shiftValue", shift.from(), shift.to())));

        document.add(heading(texts.get("observationsHeading")));
        document.add(observations);
    }
}
