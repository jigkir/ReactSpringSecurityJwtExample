package com.lacouf.rsbjwt.model.contract;

import java.util.Locale;

public enum ContractLanguage {
    FR(Locale.CANADA_FRENCH),
    EN(Locale.CANADA);

    private final Locale locale;

    ContractLanguage(Locale locale) {
        this.locale = locale;
    }

    public Locale getLocale() {
        return locale;
    }
}