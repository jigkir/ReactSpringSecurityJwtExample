package com.lacouf.rsbjwt.service.contract;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.service.pdf.PdfLayout;
import com.lacouf.rsbjwt.service.pdf.PdfTexts;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.NumberFormat;

import static com.lacouf.rsbjwt.service.pdf.PdfLayout.*;

// Builds the contract PDF on demand from the contract stored in the database (the PDF itself is never stored).
// The texts come from messages.properties (French) and messages_en.properties (English)
@Component
public class ContractPdfGenerator {
    private static final String MESSAGE_PREFIX = "contract.pdf.";
    private static final String WORK_MODE_KEY_PREFIX = "workMode.";

    private static final float PARTY_BORDER_WIDTH = 3;
    private static final float BULLET_INDENT = 12;
    private static final float BULLET_SYMBOL_INDENT = 8;
    private static final float ITEM_SPACING = 3;
    private static final int PARTY_COLUMNS = 3;
    private static final String BULLET = "\u2022";

    private final MessageSource messageSource;

    public ContractPdfGenerator(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public byte[] generate(Contract contract, DocumentLanguage language) {
        PdfTexts texts = new PdfTexts(messageSource, language.getLocale(), MESSAGE_PREFIX);

        return PdfLayout.write(texts, document -> {
            writeHeader(document, contract, texts);
            writeParties(document, contract, texts);
            writeTerms(document, contract.getInternship(), texts);
            writeTasks(document, contract.getInternship(), texts);
            writeCommitments(document, texts);
            writeSignatures(document, contract, texts);
        });
    }

    private void writeHeader(Document document, Contract contract, PdfTexts texts) {
        document.add(header(texts.get("title"), texts.get("createdAt", formatDate(contract.getCreatedAt().toLocalDate(), texts.locale()))));
        document.add(new Paragraph(texts.get("introduction")).setMarginTop(HEADING_TOP_MARGIN));
    }

    private void writeParties(Document document, Contract contract, PdfTexts texts) {
        Manager manager = contract.getManager();
        Employer employer = contract.getEmployer();
        Student student = contract.getStudent();

        Cell college = partyCell(texts.get("collegeParty"), manager == null ? texts.get("managerPending") : manager.getFullName(),
                texts.get("managerRole"), manager == null ? "" : manager.getEmail());
        Cell company = partyCell(texts.get("employerParty"), employer.getCompanyName(),
                texts.get("representedBy", employer.getFullName()), employer.getEmail());
        Cell intern = partyCell(texts.get("studentParty"), student.getFullName(),
                texts.get("studentId", student.getStudentId()), student.getEmail());

        document.add(heading(texts.get("partiesHeading")));
        document.add(new Table(PARTY_COLUMNS).useAllAvailableWidth().addCell(college).addCell(company).addCell(intern));
    }

    private void writeTerms(Document document, Internship internship, PdfTexts texts) {
        Table terms = detailsTable();

        addDetail(terms, texts.get("position"), internship.getTitle());
        addDetail(terms, texts.get("location"), internship.getLocation());
        addDetail(terms, texts.get("workMode"), texts.get(WORK_MODE_KEY_PREFIX + internship.getWorkMode().name()));
        addDetail(terms, texts.get("period"), texts.shared("periodValue", formatDate(internship.getStartDate(), texts.locale()), formatDate(internship.getEndDate(), texts.locale())));
        addDetail(terms, texts.get("duration"), texts.get("durationValue", internship.getDurationInWeeks()));
        addDetail(terms, texts.get("hourlyRate"), formatHourlyRate(internship.getCompensationAmount(), texts));
        addDetail(terms, texts.get("negotiable"), texts.shared(internship.isCompensationNegotiable() ? "yes" : "no"));

        document.add(heading(texts.get("termsHeading")));
        document.add(terms);
    }

    private void writeTasks(Document document, Internship internship, PdfTexts texts) {
        document.add(heading(texts.get("tasksHeading")));
        document.add(new Paragraph(internship.getDescription()));
        document.add(subheading(texts.get("requiredSkills")));
        document.add(new Paragraph(internship.getRequiredSkills()));
    }

    private void writeCommitments(Document document, PdfTexts texts) {
        document.add(heading(texts.get("commitmentsHeading")));
        document.add(commitments(texts.get("collegeCommitmentsTitle"), texts.get("collegeCommitments")));
        document.add(commitments(texts.get("employerCommitmentsTitle"), texts.get("employerCommitments")));
        document.add(commitments(texts.get("studentCommitmentsTitle"), texts.get("studentCommitments")));
    }

    private void writeSignatures(Document document, Contract contract, PdfTexts texts) {
        Table signatures = signaturesTable(texts);

        addSignature(signatures, texts.get("studentParty"), contract.getStudent().getFullName(), contract.getSignedAtOf(ContractParty.STUDENT), texts);
        addSignature(signatures, texts.get("employerParty"), contract.getEmployer().getFullName(), contract.getSignedAtOf(ContractParty.EMPLOYER), texts);
        addSignature(signatures, texts.get("collegeParty"), contract.getManager() == null ? "" : contract.getManager().getFullName(), contract.getSignedAtOf(ContractParty.MANAGER), texts);

        document.add(new Div().setKeepTogether(true)
                .add(heading(texts.get("signaturesHeading")))
                .add(new Paragraph(texts.get("signaturesExplanation")))
                .add(signatures));
    }

    private static Div commitments(String title, String commitments) {
        List items = new List().setListSymbol(BULLET).setSymbolIndent(BULLET_SYMBOL_INDENT).setMarginLeft(BULLET_INDENT);

        commitments.lines().forEach(commitment -> items.add((ListItem) new ListItem(commitment).setMarginBottom(ITEM_SPACING)));

        return new Div().setKeepTogether(true).add(subheading(title)).add(items);
    }

    private static Cell partyCell(String role, String name, String detail, String email) {
        return new Cell().setBackgroundColor(LIGHT_BACKGROUND_COLOR).setPadding(CELL_PADDING)
                .setBorder(new SolidBorder(ColorConstants.WHITE, PARTY_BORDER_WIDTH))
                .setBorderTop(new SolidBorder(PRIMARY_COLOR, PARTY_BORDER_WIDTH))
                .add(new Paragraph(role).setFontSize(SMALL_FONT_SIZE).setFontColor(MUTED_TEXT_COLOR).simulateBold())
                .add(new Paragraph(name).simulateBold())
                .add(new Paragraph(detail))
                .add(new Paragraph(email).setFontColor(MUTED_TEXT_COLOR));
    }

    private static String formatHourlyRate(BigDecimal hourlyRate, PdfTexts texts) {
        return hourlyRate == null ? texts.get("notSpecified") : texts.get("hourlyRateValue", NumberFormat.getCurrencyInstance(texts.locale()).format(hourlyRate));
    }
}