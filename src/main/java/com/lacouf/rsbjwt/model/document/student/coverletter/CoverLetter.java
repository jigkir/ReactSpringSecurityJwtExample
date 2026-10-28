package com.lacouf.rsbjwt.model.document.student.coverletter;

import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.Entity;

import java.time.LocalDateTime;

@Entity
public class CoverLetter extends Document {

    public CoverLetter() {
    }

    public CoverLetter(byte[] content, String fileName, LocalDateTime uploadDate) {
        super(content, fileName, uploadDate);
    }

    public void setStudent(Student student) {
        setUser(student);
    }
}
