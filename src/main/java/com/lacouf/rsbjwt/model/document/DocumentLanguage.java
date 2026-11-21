package com.lacouf.rsbjwt.model.document;

import java.util.Locale;

public enum DocumentLanguage {
    FR(Locale.CANADA_FRENCH),
    EN(Locale.CANADA);

    private final Locale locale;

    DocumentLanguage(Locale locale) {
        this.locale = locale;
    }

    public Locale getLocale() {
        return locale;
    }
}