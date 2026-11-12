package com.lacouf.rsbjwt.service.contract;

import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.List;
import com.itextpdf.layout.element.ListItem;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractLanguage;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;

// Builds the contract PDF on demand from the contract stored in the database (the PDF itself is never stored).
// The texts come from messages.properties (French) and messages_en.properties (English)
@Component
public class ContractPdfGenerator {
    private static final String MESSAGE_PREFIX = "contract.pdf.";
    private static final String WORK_MODE_KEY_PREFIX = "workMode.";
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private static final Color PRIMARY_COLOR = new DeviceRgb(31, 58, 95);
    private static final Color LIGHT_BACKGROUND_COLOR = new DeviceRgb(242, 245, 249);
    private static final Color BORDER_COLOR = new DeviceRgb(218, 224, 232);
    private static final Color MUTED_TEXT_COLOR = new DeviceRgb(96, 106, 120);
    private static final Color SIGNED_COLOR = new DeviceRgb(30, 120, 70);
    private static final Color PENDING_COLOR = new DeviceRgb(170, 100, 0);

    private static final float TITLE_FONT_SIZE = 20;
    private static final float HEADING_FONT_SIZE = 12;
    private static final float BODY_FONT_SIZE = 10;
    private static final float SMALL_FONT_SIZE = 8;
    private static final float HEADER_PADDING = 14;
    private static final float CELL_PADDING = 6;
    private static final float HEADING_TOP_MARGIN = 18;
    private static final float HEADING_BORDER_WIDTH = 1.5f;
    private static final float PARTY_BORDER_WIDTH = 3;
    private static final float BULLET_INDENT = 12;
    private static final float BULLET_SYMBOL_INDENT = 8;
    private static final float ITEM_SPACING = 3;
    private static final float FOOTER_BOTTOM = 25;
    private static final float[] TERMS_COLUMN_WIDTHS = {35, 65};
    private static final float[] SIGNATURES_COLUMN_WIDTHS = {25, 30, 45};
    private static final int HEADER_COLUMNS = 2;
    private static final int PARTY_COLUMNS = 3;
    private static final String BULLET = "\u2022";

    private final MessageSource messageSource;

    public ContractPdfGenerator(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public byte[] generate(Contract contract, ContractLanguage language) {
        ContractTexts texts = new ContractTexts(messageSource, language.getLocale());
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(output));

        try (Document document = new Document(pdf, PageSize.LETTER, false)) {
            document.setFontSize(BODY_FONT_SIZE);
            writeHeader(document, contract, texts);
            writeParties(document, contract, texts);
            writeTerms(document, contract.getInternship(), texts);
            writeTasks(document, contract.getInternship(), texts);
            writeCommitments(document, texts);
            writeSignatures(document, contract, texts);
            writeFooters(document, pdf, texts);
        }

        return output.toByteArray();
    }

    private void writeHeader(Document document, Contract contract, ContractTexts texts) {
        Cell title = headerCell(TextAlignment.LEFT)
                .add(new Paragraph(texts.get("title")).simulateBold().setFontSize(TITLE_FONT_SIZE));
        Cell creationDate = headerCell(TextAlignment.RIGHT)
                .add(new Paragraph(texts.get("createdAt", formatDate(contract.getCreatedAt().toLocalDate(), texts))));

        document.add(new Table(HEADER_COLUMNS).useAllAvailableWidth().addCell(title).addCell(creationDate));
        document.add(new Paragraph(texts.get("introduction")).setMarginTop(HEADING_TOP_MARGIN));
    }

    private void writeParties(Document document, Contract contract, ContractTexts texts) {
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

    private void writeTerms(Document document, Internship internship, ContractTexts texts) {
        Table terms = new Table(UnitValue.createPercentArray(TERMS_COLUMN_WIDTHS)).useAllAvailableWidth();

        addTerm(terms, texts.get("position"), internship.getTitle());
        addTerm(terms, texts.get("location"), internship.getLocation());
        addTerm(terms, texts.get("workMode"), texts.get(WORK_MODE_KEY_PREFIX + internship.getWorkMode().name()));
        addTerm(terms, texts.get("period"), texts.get("periodValue", formatDate(internship.getStartDate(), texts), formatDate(internship.getEndDate(), texts)));
        addTerm(terms, texts.get("duration"), texts.get("durationValue", internship.getDurationInWeeks()));
        addTerm(terms, texts.get("hourlyRate"), formatHourlyRate(internship.getCompensationAmount(), texts));
        addTerm(terms, texts.get("negotiable"), texts.get(internship.isCompensationNegotiable() ? "yes" : "no"));

        document.add(heading(texts.get("termsHeading")));
        document.add(terms);
    }

    private void writeTasks(Document document, Internship internship, ContractTexts texts) {
        document.add(heading(texts.get("tasksHeading")));
        document.add(new Paragraph(internship.getDescription()));
        document.add(subheading(texts.get("requiredSkills")));
        document.add(new Paragraph(internship.getRequiredSkills()));
    }

    private void writeCommitments(Document document, ContractTexts texts) {
        document.add(heading(texts.get("commitmentsHeading")));
        document.add(commitments(texts.get("collegeCommitmentsTitle"), texts.get("collegeCommitments")));
        document.add(commitments(texts.get("employerCommitmentsTitle"), texts.get("employerCommitments")));
        document.add(commitments(texts.get("studentCommitmentsTitle"), texts.get("studentCommitments")));
    }

    private void writeSignatures(Document document, Contract contract, ContractTexts texts) {
        Table signatures = new Table(UnitValue.createPercentArray(SIGNATURES_COLUMN_WIDTHS)).useAllAvailableWidth()
                .addHeaderCell(columnHeaderCell(texts.get("party")))
                .addHeaderCell(columnHeaderCell(texts.get("name")))
                .addHeaderCell(columnHeaderCell(texts.get("status")));

        addSignature(signatures, contract, ContractParty.STUDENT, texts.get("studentParty"), contract.getStudent().getFullName(), texts);
        addSignature(signatures, contract, ContractParty.EMPLOYER, texts.get("employerParty"), contract.getEmployer().getFullName(), texts);
        addSignature(signatures, contract, ContractParty.MANAGER, texts.get("collegeParty"), contract.getManager() == null ? "" : contract.getManager().getFullName(), texts);

        document.add(new Div().setKeepTogether(true)
                .add(heading(texts.get("signaturesHeading")))
                .add(new Paragraph(texts.get("signaturesExplanation")))
                .add(signatures));
    }

    private void writeFooters(Document document, PdfDocument pdf, ContractTexts texts) {
        int numberOfPages = pdf.getNumberOfPages();
        float right = PageSize.LETTER.getWidth() - document.getRightMargin();

        for (int page = 1; page <= numberOfPages; page++) {
            document.showTextAligned(footer(texts.get("page", page, numberOfPages)), right, FOOTER_BOTTOM, page, TextAlignment.RIGHT, VerticalAlignment.BOTTOM, 0);
        }
    }

    private void addSignature(Table signatures, Contract contract, ContractParty party, String partyLabel, String name, ContractTexts texts) {
        LocalDateTime signedAt = contract.getSignedAtOf(party);
        Paragraph status = signedAt == null
                ? new Paragraph(texts.get("pendingSignature")).setFontColor(PENDING_COLOR)
                : new Paragraph(texts.get("signedAt", formatDate(signedAt.toLocalDate(), texts), signedAt.format(TIME_FORMAT))).setFontColor(SIGNED_COLOR);

        signatures.addCell(rowCell(new Paragraph(partyLabel).simulateBold()))
                .addCell(rowCell(new Paragraph(name)))
                .addCell(rowCell(status));
    }

    private static void addTerm(Table terms, String label, String value) {
        terms.addCell(rowCell(new Paragraph(label).setFontColor(MUTED_TEXT_COLOR)))
                .addCell(rowCell(new Paragraph(value).simulateBold()));
    }

    private static Div commitments(String title, String commitments) {
        List items = new List().setListSymbol(BULLET).setSymbolIndent(BULLET_SYMBOL_INDENT).setMarginLeft(BULLET_INDENT);

        commitments.lines().forEach(commitment -> items.add((ListItem) new ListItem(commitment).setMarginBottom(ITEM_SPACING)));

        return new Div().setKeepTogether(true).add(subheading(title)).add(items);
    }

    private static Paragraph heading(String text) {
        return new Paragraph(text).simulateBold().setFontSize(HEADING_FONT_SIZE).setFontColor(PRIMARY_COLOR)
                .setMarginTop(HEADING_TOP_MARGIN).setKeepWithNext(true)
                .setBorderBottom(new SolidBorder(PRIMARY_COLOR, HEADING_BORDER_WIDTH));
    }

    private static Paragraph subheading(String text) {
        return new Paragraph(text).simulateBold().setFontColor(PRIMARY_COLOR);
    }

    private static Paragraph footer(String text) {
        return new Paragraph(text).setFontSize(SMALL_FONT_SIZE).setFontColor(MUTED_TEXT_COLOR);
    }

    private static Cell headerCell(TextAlignment alignment) {
        return new Cell().setBackgroundColor(PRIMARY_COLOR).setFontColor(ColorConstants.WHITE)
                .setBorder(Border.NO_BORDER).setPadding(HEADER_PADDING)
                .setTextAlignment(alignment).setVerticalAlignment(VerticalAlignment.MIDDLE);
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

    private static Cell columnHeaderCell(String text) {
        return rowCell(new Paragraph(text).simulateBold().setFontColor(PRIMARY_COLOR)).setBackgroundColor(LIGHT_BACKGROUND_COLOR);
    }

    private static Cell rowCell(Paragraph content) {
        return new Cell().add(content).setPadding(CELL_PADDING)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(BORDER_COLOR, 1));
    }

    private static String formatDate(LocalDate date, ContractTexts texts) {
        return date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(texts.locale()));
    }

    private static String formatHourlyRate(BigDecimal hourlyRate, ContractTexts texts) {
        return hourlyRate == null ? texts.get("notSpecified") : texts.get("hourlyRateValue", NumberFormat.getCurrencyInstance(texts.locale()).format(hourlyRate));
    }

    private record ContractTexts(MessageSource messageSource, Locale locale) {
        String get(String key, Object... arguments) {
            return messageSource.getMessage(MESSAGE_PREFIX + key, arguments, locale);
        }
    }
}