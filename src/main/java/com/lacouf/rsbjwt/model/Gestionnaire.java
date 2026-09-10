package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("G")
@Getter
@NoArgsConstructor
public class Gestionnaire extends UserApp {
	@Column(unique = true, nullable = false)
	private String matricule;
	private String phoneNumber;

	@Builder
	public Gestionnaire(
		Long id, String firstName, String lastName, String email, String password,
		String matricule, String phoneNumber){
		super(firstName, lastName, Credentials.builder().email(email).password(password).role(Role.GESTIONNAIRE).build());
		this.matricule = matricule;
		this.phoneNumber = phoneNumber;
	}
}
