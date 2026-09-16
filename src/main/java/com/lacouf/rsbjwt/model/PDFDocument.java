package com.lacouf.rsbjwt.model;


import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
public class PDFDocument {

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

    public PDFDocument() {
    }

    public PDFDocument(byte[] content, String fileName) {
        this.content = content;
        this.fileName = fileName;
    }
}
