package com.lacouf.rsbjwt.model.contract;

import jakarta.persistence.Embeddable;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Embeddable
public class Signature {

    private byte[] image;
    private LocalDateTime signedAt;

    public Signature() {
    }

    public Signature(byte[] image, LocalDateTime signedAt) {
        this.image = image;
        this.signedAt = signedAt;
    }
}
