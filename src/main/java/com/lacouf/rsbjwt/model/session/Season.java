package com.lacouf.rsbjwt.model.session;

import java.time.LocalDate;
import java.time.MonthDay;

public enum Season {
    WINTER("H", MonthDay.of(1, 1), MonthDay.of(5, 31));

    private final String code;
    private final MonthDay firstDay;
    private final MonthDay lastDay;

    Season(String code, MonthDay firstDay, MonthDay lastDay) {
        this.code = code;
        this.firstDay = firstDay;
        this.lastDay = lastDay;
    }

    public String getCode() {
        return code;
    }

    public LocalDate firstDayIn(int year) {
        return firstDay.atYear(year);
    }

    public LocalDate lastDayIn(int year) {
        return lastDay.atYear(year);
    }
}
