package com.lacouf.rsbjwt.service.evaluation;

import com.itextpdf.layout.element.Div;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.service.pdf.PdfTexts;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;

import static com.lacouf.rsbjwt.service.pdf.PdfLayout.*;

public final class EvaluationPdfSections {
    private static final String RATING_KEY_PREFIX = "rating.";
    private static final String CRITERION_KEY_PREFIX = "criterion.";
    private static final String CHOSEN_RATING_MARK = "X";
    private static final String EMPTY_TEXT = "";
    private static final float CRITERION_COLUMN_WIDTH = 40;
    private static final float RATING_COLUMN_WIDTH = 12;

    private EvaluationPdfSections() {
    }

    public static Table evaluationHeader(AcademicSession session, PdfTexts texts) {
        return header(texts.get("title"), texts.shared("session", session.getName()));
    }

    public static <C extends Enum<C>> Table ratingGrid(Collection<C> criteria, Map<C, AgreementLevel> ratings, PdfTexts texts) {
        AgreementLevel[] levels = AgreementLevel.values();
        Table grid = new Table(UnitValue.createPercentArray(ratingGridWidths(levels.length))).useAllAvailableWidth()
                .addHeaderCell(columnHeaderCell(EMPTY_TEXT));

        for (AgreementLevel level : levels) {
            grid.addHeaderCell(columnHeaderCell(texts.get(RATING_KEY_PREFIX + level.name()))
                    .setFontSize(SMALL_FONT_SIZE).setTextAlignment(TextAlignment.CENTER));
        }

        for (C criterion : criteria) {
            grid.addCell(rowCell(new Paragraph(texts.get(CRITERION_KEY_PREFIX + criterion.name()))));

            for (AgreementLevel level : levels) {
                grid.addCell(rowCell(ratingMark(level == ratings.get(criterion))).setTextAlignment(TextAlignment.CENTER));
            }
        }

        return grid;
    }

    public static Div signature(String signerRole, String signerName, LocalDateTime signedAt, PdfTexts texts) {
        Table signatures = signaturesTable(texts);

        addSignature(signatures, signerRole, signerName, signedAt, texts);

        return new Div().setKeepTogether(true)
                .add(heading(texts.shared("signatureHeading")))
                .add(new Paragraph(texts.shared("signatureExplanation")))
                .add(signatures);
    }

    public static String answerLabel(String keyPrefix, Enum<?> value, PdfTexts texts) {
        return value == null ? notAnswered(texts) : texts.get(keyPrefix + value.name());
    }

    public static String yesNoAnswer(Boolean value, PdfTexts texts) {
        return value == null ? notAnswered(texts) : texts.shared(value ? "yes" : "no");
    }

    public static String numberAnswer(BigDecimal value, PdfTexts texts) {
        return value == null ? notAnswered(texts) : NumberFormat.getNumberInstance(texts.locale()).format(value);
    }

    public static String moneyAnswer(BigDecimal value, PdfTexts texts) {
        return value == null ? notAnswered(texts) : NumberFormat.getCurrencyInstance(texts.locale()).format(value);
    }

    public static String textAnswer(String value, PdfTexts texts) {
        return value == null || value.isBlank() ? notAnswered(texts) : value;
    }

    private static float[] ratingGridWidths(int numberOfLevels) {
        float[] widths = new float[numberOfLevels + 1];
        Arrays.fill(widths, RATING_COLUMN_WIDTH);
        widths[0] = CRITERION_COLUMN_WIDTH;

        return widths;
    }

    private static Paragraph ratingMark(boolean chosen) {
        return new Paragraph(chosen ? CHOSEN_RATING_MARK : EMPTY_TEXT).simulateBold().setFontColor(PRIMARY_COLOR);
    }

    private static String notAnswered(PdfTexts texts) {
        return texts.shared("notAnswered");
    }
}
