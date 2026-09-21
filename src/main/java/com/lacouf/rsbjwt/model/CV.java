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

    @Column
    private CvVisibility visibility;

    @Column
    private CVSharingScope sharingScope;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    public CV() {
    }

    public CV(byte[] content, CvVisibility visibility, CVSharingScope sharingScope) {
        this.content = content;
        this.visibility = visibility;
        this.sharingScope = sharingScope;
    }

}