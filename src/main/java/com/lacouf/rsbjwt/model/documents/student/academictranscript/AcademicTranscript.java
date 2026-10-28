package com.lacouf.rsbjwt.model.documents.student.academictranscript;

import com.lacouf.rsbjwt.model.documents.Document;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.Entity;

import java.time.LocalDateTime;

@Entity
public class AcademicTranscript extends Document {

    public AcademicTranscript() {
    }

    public AcademicTranscript(byte[] content, String fileName, LocalDateTime uploadDate) {
        super(content, fileName, uploadDate);
    }

    public void setStudent(Student student) {
        setUser(student);
    }
}
