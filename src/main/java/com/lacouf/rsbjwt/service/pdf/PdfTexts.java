package com.lacouf.rsbjwt.service.pdf;

import org.springframework.context.MessageSource;

import java.util.Locale;

// Texts of a generated PDF, read from messages.properties (French) and messages_en.properties (English)
public record PdfTexts(MessageSource messageSource, Locale locale, String prefix) {
    private static final String SHARED_PREFIX = "pdf.";

    public String get(String key, Object... arguments) {
        return message(prefix + key, arguments);
    }

    public String shared(String key, Object... arguments) {
        return message(SHARED_PREFIX + key, arguments);
    }

    private String message(String code, Object[] arguments) {
        return messageSource.getMessage(code, arguments, locale);
    }
}