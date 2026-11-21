package com.lacouf.rsbjwt.service.pdf;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.springframework.context.MessageSource;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

// Reads the generated PDFs in the tests, with the same texts as the application
public final class PdfTestSupport {

    private PdfTestSupport() {
    }

    public static MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setAlwaysUseMessageFormat(true);

        return messageSource;
    }

    public static String textOf(byte[] pdf) throws IOException {
        StringBuilder text = new StringBuilder();

        try (PdfDocument document = pdfDocumentOf(pdf)) {
            for (int page = 1; page <= document.getNumberOfPages(); page++) {
                text.append(PdfTextExtractor.getTextFromPage(document.getPage(page))).append('\n');
            }
        }

        return text.toString();
    }

    public static PdfDocument pdfDocumentOf(byte[] pdf) throws IOException {
        return new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)));
    }
}