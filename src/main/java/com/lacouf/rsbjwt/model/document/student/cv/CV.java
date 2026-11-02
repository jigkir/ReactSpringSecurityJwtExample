package com.lacouf.rsbjwt.model.document.student.cv;


import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class CV extends Document {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status;

    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    public CV() {
    }

    public CV(byte[] content, String fileName, LocalDateTime uploadDate) {
        super(content, fileName, uploadDate);
        this.status = ReviewStatus.PENDING;
    }

    public Student getStudent() {
        return (Student) getUser();
    }

    public void setStudent(Student student) {
        setUser(student);
    }
}