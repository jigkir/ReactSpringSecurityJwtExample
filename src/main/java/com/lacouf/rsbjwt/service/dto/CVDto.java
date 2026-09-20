package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CV;

public record CVDto (
        byte[] content
)
{
    public static CVDto fromCV(CV cv) {
        return new CVDto(cv.getContent());
    }

    public byte[] getContent() {
        return content;
    }

    public CV toCV() {
        return new CV(content);
    }

}
