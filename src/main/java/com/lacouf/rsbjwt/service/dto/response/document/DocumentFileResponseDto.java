package com.lacouf.rsbjwt.service.dto.response.document;

import com.lacouf.rsbjwt.model.documents.student.cv.CV;

public record DocumentFileResponseDto(long id, String fileName, byte[] content) {
    public static DocumentFileResponseDto of(CV cv) {
        return new DocumentFileResponseDto(cv.getId(), cv.getFileName(), cv.getContent());
    }
}
