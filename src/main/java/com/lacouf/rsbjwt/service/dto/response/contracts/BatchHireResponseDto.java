package com.lacouf.rsbjwt.service.dto.response.contracts;

import java.util.List;

public record BatchHireResponseDto(
        List<Long> successfulApplicationIds,
        List<BatchErrorDto> errors
) {}
