package com.lacouf.rsbjwt.model.cv;


import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class CV {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "bytea")
    private byte[] content;

    @Column
    private String fileHash;

    @Column
    private String fileName;

    @Column
    private LocalDateTime uploadDate;

    @Enumerated(EnumType.STRING)
    @Column
    private CvVisibility visibility;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CvStatus status;

    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    public CV() {
    }

    public CV(byte[] content, CvVisibility visibility, String fileName, LocalDateTime uploadDate) {
        this.content = content;
        this.visibility = visibility;
        this.fileName = fileName;
        this.uploadDate = uploadDate;
        this.status = CvStatus.PENDING;
    }

}