package com.lacouf.rsbjwt.model.evaluation.workplace;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

@Embeddable
public record ShiftRange(
        @NotNull
        @Column(name = "start_time", nullable = false)
        LocalTime from,

        @NotNull
        @Column(name = "end_time", nullable = false)
        LocalTime to
) {
}
