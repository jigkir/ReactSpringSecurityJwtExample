package com.lacouf.rsbjwt.service.traduction.cv;

import com.lacouf.rsbjwt.model.document.student.cv.CV;

public record CVChangedEvent(long cvId, String rejectionMessage) {
    public static CVChangedEvent of(CV cv){
        return new CVChangedEvent(cv.getId(), cv.getRejectionComment());
    }
}
