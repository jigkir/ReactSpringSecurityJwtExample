package com.lacouf.rsbjwt.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserLoginDTO(
		@NotBlank
		@Email
		String email,

		@NotBlank
		String password
){}
