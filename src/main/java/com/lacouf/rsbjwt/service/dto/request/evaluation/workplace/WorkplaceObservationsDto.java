package com.lacouf.rsbjwt.service.dto.request.evaluation.workplace;

import com.lacouf.rsbjwt.model.evaluation.workplace.InternCapacity;
import com.lacouf.rsbjwt.model.evaluation.workplace.PreferredInternship;
import com.lacouf.rsbjwt.model.evaluation.workplace.ShiftRange;
import jakarta.validation.Valid;

import java.util.List;

public record WorkplaceObservationsDto(
        PreferredInternship preferredForStage,
        InternCapacity openToInternCount,
        Boolean wouldWelcomeSameInternAgain,
        Boolean variableShifts,
        List<@Valid ShiftRange> shiftRanges
) {
    public static final WorkplaceObservationsDto EMPTY = new WorkplaceObservationsDto(null, null, null, null, List.of());

    public WorkplaceObservationsDto {
        shiftRanges = shiftRanges == null ? List.of() : shiftRanges;
    }
}
