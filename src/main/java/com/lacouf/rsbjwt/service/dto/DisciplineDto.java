package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;

import java.util.List;

public record DisciplineDto(List<String> disciplines) {
    public static DisciplineDto of(List<Discipline> disciplines) {
        return new DisciplineDto(disciplines.stream().map(Discipline::name).toList());
    }
}
