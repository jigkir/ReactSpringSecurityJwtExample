package com.lacouf.rsbjwt.service.dto.response.document;

import com.lacouf.rsbjwt.model.document.Document;

import java.time.LocalDateTime;

public record DocumentResponseDto(
        long id,
        String fileName,
        long sizeBytes,
        LocalDateTime uploadedAt
) {
    public static DocumentResponseDto of(Document document) {
        byte[] content = document.getContent();

        return new DocumentResponseDto(
                document.getId(),
                document.getFileName(),
                content.length,
                document.getUploadDate()
        );
    }
}
