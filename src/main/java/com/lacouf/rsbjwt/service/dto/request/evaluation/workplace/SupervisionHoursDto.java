package com.lacouf.rsbjwt.service.dto.request.evaluation.workplace;

import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record SupervisionHoursDto(
        @PositiveOrZero
        BigDecimal month1,

        @PositiveOrZero
        BigDecimal month2,

        @PositiveOrZero
        BigDecimal month3
) {
    public static final SupervisionHoursDto EMPTY = new SupervisionHoursDto(null, null, null);
}
