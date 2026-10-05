package com.lacouf.rsbjwt.service.dto.response.cv;

import com.lacouf.rsbjwt.model.cv.CV;

public record CvFileResponseDto(long id, String fileName, byte[] content) {
    public static CvFileResponseDto of(CV cv) {
        return new CvFileResponseDto(cv.getId(), cv.getFileName(), cv.getContent());
    }
}
