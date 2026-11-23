package com.lacouf.rsbjwt.service.evaluation.intern;

import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.intern.InternCriterion;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluationSection;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.service.pdf.PdfTexts;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationPdfSections.*;
import static com.lacouf.rsbjwt.service.pdf.PdfLayout.*;

@Component
public class InternEvaluationPdfGenerator {
    private static final String MESSAGE_PREFIX = "internEvaluation.pdf.";
    private static final String DISCIPLINE_KEY_PREFIX = "discipline.";
    private static final String SECTION_KEY_PREFIX = "section.";
    private static final String DESCRIPTION_KEY_SUFFIX = ".description";
    private static final String OVERALL_APPRECIATION_KEY_PREFIX = "overallAppreciation.";
    private static final String NEXT_INTERNSHIP_INTEREST_KEY_PREFIX = "nextInternshipInterest.";

    private final MessageSource messageSource;

    public InternEvaluationPdfGenerator(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public byte[] generate(InternEvaluation evaluation, DocumentLanguage language) {
        PdfTexts texts = new PdfTexts(messageSource, language.getLocale(), MESSAGE_PREFIX);
        InternshipTracking tracking = evaluation.getTracking();

        return write(texts, document -> {
            document.add(evaluationHeader(tracking.getSession(), texts));
            writeIdentification(document, evaluation, tracking, texts);

            for (InternEvaluationSection section : InternEvaluationSection.values()) {
                writeSection(document, evaluation, section, texts);
            }

            writeOverallAppreciation(document, evaluation, texts);
            document.add(signature(texts.get("signerRole"), tracking.getEmployer().getFullName(), evaluation.getSignedAt(), texts));
        });
    }

    private void writeIdentification(Document document, InternEvaluation evaluation, InternshipTracking tracking, PdfTexts texts) {
        Student student = tracking.getStudent();
        Employer employer = tracking.getEmployer();
        Table identification = detailsTable();

        addDetail(identification, texts.get("studentName"), student.getFullName());
        addDetail(identification, texts.get("program"), texts.get(DISCIPLINE_KEY_PREFIX + student.getDiscipline().name()));
        addDetail(identification, texts.get("companyName"), employer.getCompanyName());
        addDetail(identification, texts.get("supervisorName"), employer.getFullName());
        addDetail(identification, texts.get("supervisorJobTitle"), textAnswer(evaluation.getSupervisorJobTitle(), texts));
        addDetail(identification, texts.get("phone"), employer.getPhoneNumber());

        document.add(heading(texts.get("identificationHeading")));
        document.add(identification);
        document.add(new Paragraph(texts.get("instructions")).setMarginTop(HEADING_TOP_MARGIN));
    }

    private void writeSection(Document document, InternEvaluation evaluation, InternEvaluationSection section, PdfTexts texts) {
        String sectionKey = SECTION_KEY_PREFIX + section.name();
        Table comments = detailsTable();

        addDetail(comments, texts.get("comments"), textAnswer(evaluation.getSectionComments().get(section), texts));

        document.add(heading(texts.get(sectionKey)));
        document.add(new Paragraph(texts.get(sectionKey + DESCRIPTION_KEY_SUFFIX)).setFontColor(MUTED_TEXT_COLOR));
        document.add(subheading(texts.get("ableTo")));
        document.add(ratingGrid(InternCriterion.of(section), evaluation.getRatings(), texts));
        document.add(comments);
    }

    private void writeOverallAppreciation(Document document, InternEvaluation evaluation, PdfTexts texts) {
        Table appreciation = detailsTable();

        addDetail(appreciation, texts.get("overallAppreciation"), answerLabel(OVERALL_APPRECIATION_KEY_PREFIX, evaluation.getOverallAppreciation(), texts));
        addDetail(appreciation, texts.get("appreciationDetails"), textAnswer(evaluation.getAppreciationDetails(), texts));
        addDetail(appreciation, texts.get("discussedWithIntern"), yesNoAnswer(evaluation.getDiscussedWithIntern(), texts));
        addDetail(appreciation, texts.get("supervisionHoursPerWeek"), numberAnswer(evaluation.getSupervisionHoursPerWeek(), texts));
        addDetail(appreciation, texts.get("nextInternshipInterest"), answerLabel(NEXT_INTERNSHIP_INTEREST_KEY_PREFIX, evaluation.getNextInternshipInterest(), texts));
        addDetail(appreciation, texts.get("technicalTraining"), textAnswer(evaluation.getTechnicalTrainingComments(), texts));

        document.add(heading(texts.get("overallHeading")));
        document.add(appreciation);
    }
}
