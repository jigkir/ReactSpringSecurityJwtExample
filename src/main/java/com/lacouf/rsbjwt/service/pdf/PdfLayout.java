package com.lacouf.rsbjwt.service.pdf;

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
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;
import java.util.function.Consumer;

// Look shared by every generated PDF (contract and evaluations): colors, header, headings, tables, signatures and page numbers
public final class PdfLayout {
    public static final Color PRIMARY_COLOR = new DeviceRgb(31, 58, 95);
    public static final Color LIGHT_BACKGROUND_COLOR = new DeviceRgb(242, 245, 249);
    public static final Color MUTED_TEXT_COLOR = new DeviceRgb(96, 106, 120);
    public static final float SMALL_FONT_SIZE = 8;
    public static final float CELL_PADDING = 6;
    public static final float HEADING_TOP_MARGIN = 18;

    private static final Color BORDER_COLOR = new DeviceRgb(218, 224, 232);
    private static final Color SIGNED_COLOR = new DeviceRgb(30, 120, 70);
    private static final Color PENDING_COLOR = new DeviceRgb(170, 100, 0);
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private static final float TITLE_FONT_SIZE = 20;
    private static final float HEADING_FONT_SIZE = 12;
    private static final float BODY_FONT_SIZE = 10;
    private static final float HEADER_PADDING = 14;
    private static final float HEADING_BORDER_WIDTH = 1.5f;
    private static final float ROW_BORDER_WIDTH = 1;
    private static final float FOOTER_BOTTOM = 25;
    private static final float[] DETAILS_COLUMN_WIDTHS = {35, 65};
    private static final float[] SIGNATURES_COLUMN_WIDTHS = {25, 30, 45};
    private static final int HEADER_COLUMNS = 2;

    private PdfLayout() {
    }

    public static byte[] write(PdfTexts texts, Consumer<Document> content) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(output));

        try (Document document = new Document(pdf, PageSize.LETTER, false)) {
            document.setFontSize(BODY_FONT_SIZE);
            content.accept(document);
            writeFooters(document, pdf, texts);
        }

        return output.toByteArray();
    }

    public static Table header(String title, String detail) {
        Cell titleCell = headerCell(TextAlignment.LEFT).add(new Paragraph(title).simulateBold().setFontSize(TITLE_FONT_SIZE));
        Cell detailCell = headerCell(TextAlignment.RIGHT).add(new Paragraph(detail));

        return new Table(HEADER_COLUMNS).useAllAvailableWidth().addCell(titleCell).addCell(detailCell);
    }

    public static Paragraph heading(String text) {
        return new Paragraph(text).simulateBold().setFontSize(HEADING_FONT_SIZE).setFontColor(PRIMARY_COLOR)
                .setMarginTop(HEADING_TOP_MARGIN).setKeepWithNext(true)
                .setBorderBottom(new SolidBorder(PRIMARY_COLOR, HEADING_BORDER_WIDTH));
    }

    public static Paragraph subheading(String text) {
        return new Paragraph(text).simulateBold().setFontColor(PRIMARY_COLOR);
    }

    public static Table detailsTable() {
        return new Table(UnitValue.createPercentArray(DETAILS_COLUMN_WIDTHS)).useAllAvailableWidth();
    }

    public static void addDetail(Table details, String label, String value) {
        details.addCell(rowCell(new Paragraph(label).setFontColor(MUTED_TEXT_COLOR)))
                .addCell(rowCell(new Paragraph(value).simulateBold()));
    }

    public static Table signaturesTable(PdfTexts texts) {
        return new Table(UnitValue.createPercentArray(SIGNATURES_COLUMN_WIDTHS)).useAllAvailableWidth()
                .addHeaderCell(columnHeaderCell(texts.shared("party")))
                .addHeaderCell(columnHeaderCell(texts.shared("name")))
                .addHeaderCell(columnHeaderCell(texts.shared("status")));
    }

    public static void addSignature(Table signatures, String party, String name, LocalDateTime signedAt, PdfTexts texts) {
        signatures.addCell(rowCell(new Paragraph(party).simulateBold()))
                .addCell(rowCell(new Paragraph(name)))
                .addCell(rowCell(signatureStatus(signedAt, texts)));
    }

    public static Cell columnHeaderCell(String text) {
        return rowCell(new Paragraph(text).simulateBold().setFontColor(PRIMARY_COLOR)).setBackgroundColor(LIGHT_BACKGROUND_COLOR);
    }

    public static Cell rowCell(Paragraph content) {
        return new Cell().add(content).setPadding(CELL_PADDING)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(BORDER_COLOR, ROW_BORDER_WIDTH));
    }

    public static String formatDate(LocalDate date, Locale locale) {
        return date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(locale));
    }

    private static Paragraph signatureStatus(LocalDateTime signedAt, PdfTexts texts) {
        return signedAt == null
                ? new Paragraph(texts.shared("pendingSignature")).setFontColor(PENDING_COLOR)
                : new Paragraph(texts.shared("signedAt", formatDate(signedAt.toLocalDate(), texts.locale()), signedAt.format(TIME_FORMAT))).setFontColor(SIGNED_COLOR);
    }

    private static void writeFooters(Document document, PdfDocument pdf, PdfTexts texts) {
        int numberOfPages = pdf.getNumberOfPages();
        float right = PageSize.LETTER.getWidth() - document.getRightMargin();

        for (int page = 1; page <= numberOfPages; page++) {
            document.showTextAligned(footer(texts.shared("page", page, numberOfPages)), right, FOOTER_BOTTOM, page, TextAlignment.RIGHT, VerticalAlignment.BOTTOM, 0);
        }
    }

    private static Paragraph footer(String text) {
        return new Paragraph(text).setFontSize(SMALL_FONT_SIZE).setFontColor(MUTED_TEXT_COLOR);
    }

    private static Cell headerCell(TextAlignment alignment) {
        return new Cell().setBackgroundColor(PRIMARY_COLOR).setFontColor(ColorConstants.WHITE)
                .setBorder(Border.NO_BORDER).setPadding(HEADER_PADDING)
                .setTextAlignment(alignment).setVerticalAlignment(VerticalAlignment.MIDDLE);
    }
}