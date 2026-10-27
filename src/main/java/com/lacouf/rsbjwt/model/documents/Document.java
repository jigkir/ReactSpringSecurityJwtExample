package com.lacouf.rsbjwt.model.documents;

import com.lacouf.rsbjwt.model.user.UserApp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
public abstract class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "bytea")
    private byte[] content;

    private String fileHash;

    private String fileName;

    private LocalDateTime uploadDate;

    @Enumerated(EnumType.STRING)
    private DocumentVisibility visibility;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @Setter(AccessLevel.PROTECTED)
    private UserApp user;

    public Document() {
    }

    public Document(byte[] content, String fileName, LocalDateTime uploadDate) {
        this.content = content;
        this.fileName = fileName;
        this.uploadDate = uploadDate;
        this.visibility = DocumentVisibility.VISIBLE;
    }

    public void hide() {
        visibility = DocumentVisibility.HIDDEN;
    }
}
