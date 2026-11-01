package com.lacouf.rsbjwt.model.session;

import java.time.LocalDate;
import java.time.MonthDay;
import java.util.Arrays;

public enum Season {
    WINTER("H", MonthDay.of(1, 1), MonthDay.of(5, 31)),
    SUMMER("E", MonthDay.of(6, 1), MonthDay.of(8, 14)),
    FALL("A", MonthDay.of(8, 15), MonthDay.of(12, 31));

    private final String code;
    private final MonthDay firstDay;
    private final MonthDay lastDay;

    Season(String code, MonthDay firstDay, MonthDay lastDay) {
        this.code = code;
        this.firstDay = firstDay;
        this.lastDay = lastDay;
    }

    public static Season of(LocalDate date) {
        MonthDay day = MonthDay.from(date);

        return Arrays.stream(values())
                .filter(season -> season.contains(day))
                .findFirst()
                .orElseThrow();
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

    private boolean contains(MonthDay day) {
        return !day.isBefore(firstDay) && !day.isAfter(lastDay);
    }
}
