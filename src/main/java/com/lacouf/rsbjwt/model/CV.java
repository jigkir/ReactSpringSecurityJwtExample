package com.lacouf.rsbjwt.model;


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

    @Lob
    @Column()
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

    @Enumerated(EnumType.STRING)
    @Column
    private CVSharingScope sharingScope;

    @Enumerated(EnumType.STRING)
    @Column
    private CvPriority priority;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    public CV() {
    }

    public CV(byte[] content, CvVisibility visibility, CVSharingScope sharingScope, CvPriority priority, String fileName, LocalDateTime uploadDate) {
        this.content = content;
        this.visibility = visibility;
        this.sharingScope = sharingScope;
        this.priority = priority;
        this.fileName = fileName;
        this.uploadDate = uploadDate;
    }

    public boolean isOwnedBy(Student student) {
        return this.student != null && this.student.equals(student);
    }

}