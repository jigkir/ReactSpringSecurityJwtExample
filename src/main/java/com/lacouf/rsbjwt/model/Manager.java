package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Manager extends UserApp {

	@Column(nullable = false)
	private String phoneNumber;

	public Manager(String firstName, String lastName, Credentials credentials, String phoneNumber){
		super(firstName, lastName, credentials);
		this.phoneNumber = phoneNumber;
	}

	public Manager() {}

	public String getPhoneNumber() {
		return phoneNumber;
	}
}
