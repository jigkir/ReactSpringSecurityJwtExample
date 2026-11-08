package com.lacouf.rsbjwt.model.document.student.cv;


import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.session.AcademicSession;
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

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AcademicSession session;

    public CV() {
    }

    public CV(byte[] content, String fileName, LocalDateTime uploadDate, AcademicSession session) {
        super(content, fileName, uploadDate);
        this.status = ReviewStatus.PENDING;
        this.session = session;
    }

    public Student getStudent() {
        return (Student) getUser();
    }

    public void setStudent(Student student) {
        setUser(student);
    }
}