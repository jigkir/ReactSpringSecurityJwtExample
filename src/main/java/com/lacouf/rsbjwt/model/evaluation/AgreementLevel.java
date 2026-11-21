package com.lacouf.rsbjwt.model.evaluation;

public enum AgreementLevel {
    TOTALLY_AGREE,
    SOMEWHAT_AGREE,
    SOMEWHAT_DISAGREE,
    TOTALLY_DISAGREE,
    CANNOT_SAY;

    public boolean isDisagreement() {
        return this == SOMEWHAT_DISAGREE || this == TOTALLY_DISAGREE;
    }
}
