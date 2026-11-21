package com.lacouf.rsbjwt.model.document.student.cv;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;

@Embeddable
@Getter
public class TranslatedContent {

    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    protected  TranslatedContent() {
    }
    public TranslatedContent(String rejectionComment) {
        this.rejectionComment = rejectionComment;
    }
}
