package com.lacouf.rsbjwt.model.document.student.cv;


import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.TranslationStatus;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Entity
@Getter
@Setter
public class CV extends Document {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status;

    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AcademicSession session;

    @Enumerated(EnumType.STRING)
    private TranslationStatus  translationStatus;

    @ElementCollection
    @CollectionTable(name = "cv_translations", joinColumns = @JoinColumn(name = "cv_id"))
    @MapKeyColumn(name = "lang")
    @BatchSize(size = 50)
    @ToString.Exclude
    private Map<String, TranslatedContent> translations = new HashMap<>();

    public CV() {
    }

    public CV(byte[] content, String fileName, LocalDateTime uploadDate, AcademicSession session) {
        super(content, fileName, uploadDate);
        this.status = ReviewStatus.PENDING;
        this.session = session;
        this.translationStatus = TranslationStatus.PENDING;
    }

    public Student getStudent() {
        return (Student) getUser();
    }

    public void setStudent(Student student) {
        setUser(student);
    }

    public void replaceTranslations(Map<String, TranslatedContent> newOnes) {
        translations.clear();
        translations.putAll(newOnes);
        this.translationStatus = TranslationStatus.DONE;
    }

    public Optional<TranslatedContent> getTranslation(String lang) {
        return Optional.ofNullable(translations.get(lang));
    }
}