package com.lacouf.rsbjwt.model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class CV {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String fileName;

    @Lob
    @Column(length = Integer.MAX_VALUE / 1000)
    private byte[] content;

    @Column
    private String fileHash;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    public CV() {
    }

    public CV(byte[] content, String fileName) {
        this.content = content;
        this.fileName = fileName;
    }
}
