package com.lacouf.rsbjwt.service.traduction;

import com.lacouf.rsbjwt.model.internship.Internship;

public record InternshipChangedEvent(long internshipId, String title, String description, String rejectionComment) {
    public static InternshipChangedEvent of(Internship i) {
        return new InternshipChangedEvent(i.getId(), i.getTitle(), i.getDescription(), i.getRejectionComment());
    }
}
