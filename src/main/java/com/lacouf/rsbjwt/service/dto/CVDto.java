package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CV;

public record CVDto (
        String fileName,
        byte[] content
)
{
    public static CVDto fromCV(CV cv) {
        return new CVDto(cv.getFileName(), cv.getContent());
    }

    public byte[] getContent() {
        return null;
    }

    public CV toCV() {
        return new CV(content, fileName);
    }

}
