package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@DiscriminatorValue("P")
@Getter
@Setter
@NoArgsConstructor
public class Prepose extends UserApp {
    private String passeKey;
    @Builder
    public Prepose(
            String firstName, String lastName, String email, String password,
            String passeKey){
        super(firstName, lastName, Credentials.builder().email(email).password(password).role(Role.PREPOSE).build());
        this.passeKey = passeKey;
    }
}
