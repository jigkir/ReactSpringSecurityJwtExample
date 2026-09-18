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
    @Column(length = Integer.MAX_VALUE / 1000)
    private byte[] content;

    @Column
    private String fileHash;

    @Column
    private LocalDateTime uploadDate;

    @OneToOne(mappedBy = "cv")
    private Student student;

    public CV() {
    }

    public CV(byte[] content) {
        this.content = content;
    }
}
