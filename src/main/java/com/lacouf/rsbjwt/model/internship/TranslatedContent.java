package com.lacouf.rsbjwt.model.internship;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;

@Embeddable
@Getter
public class TranslatedContent {

    @Column
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    protected TranslatedContent() {}
    public TranslatedContent(String title, String description, String rejectionComment) {
        this.title = title;
        this.description = description;
        this.rejectionComment = rejectionComment;
    }
}
