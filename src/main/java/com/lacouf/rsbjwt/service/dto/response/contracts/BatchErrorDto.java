package com.lacouf.rsbjwt.service.dto.response.contracts;

public record BatchErrorDto(
        Long applicationId,
        String errorMessage) {
}
