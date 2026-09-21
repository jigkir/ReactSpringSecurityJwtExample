package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.CVSharingScope;
import com.lacouf.rsbjwt.model.CvVisibility;

public record CVDto (
        byte[] content,
        Long id,
        CVSharingScope sharingScope
)
{
    public static CVDto fromCV(CV cv) {
        return new CVDto(cv.getContent(), cv.getId(), cv.getSharingScope());
    }

    public byte[] getContent() {
        return content;
    }

    public CV toCV() {
        return new CV(content, CvVisibility.VISIBLE, CVSharingScope.PRIVATE);
    }

}
