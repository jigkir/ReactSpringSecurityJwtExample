package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@DiscriminatorValue("E")
@Getter
@NoArgsConstructor
public class Emprunteur extends UserApp {
    private LocalDate since;
    @Builder
    public Emprunteur(
            String firstName, String lastName, String email, String password,
            LocalDate since){
        super(firstName, lastName, Credentials.builder().email(email).password(password).role(Role.EMPRUNTEUR).build());
        this.since = since;
    }
}
