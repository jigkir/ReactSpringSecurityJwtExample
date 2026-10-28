package com.lacouf.rsbjwt.service.dto.response.document;

import com.lacouf.rsbjwt.model.documents.Document;

public record DocumentFileResponseDto(long id, String fileName, byte[] content) {
    public static DocumentFileResponseDto of(Document document) {
        return new DocumentFileResponseDto(document.getId(), document.getFileName(), document.getContent());
    }
}
