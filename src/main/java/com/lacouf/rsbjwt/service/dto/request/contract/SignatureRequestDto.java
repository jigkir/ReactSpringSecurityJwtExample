package com.lacouf.rsbjwt.service.dto.request.contract;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

public record SignatureRequestDto(
        @AssertTrue
        boolean termsAccepted,

        @NotBlank
        String password
) {
}
