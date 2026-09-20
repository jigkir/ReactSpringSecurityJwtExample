package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.model.UserApp;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthProvider implements AuthenticationProvider{
	private final PasswordEncoder passwordEncoder;
	private final UserAppRepository userAppRepository;

	private final String INVALID_CREDENTIALS = "Incorrect email or password";

	@Override
	public Authentication authenticate(Authentication authentication) {
		UserApp user = loadUserByEmail(authentication.getName());
		validateAuthentication(authentication, user);
		return new UsernamePasswordAuthenticationToken(
			user.getEmail(),
			null,
			user.getAuthorities()
		);
	}

	@Override
	public boolean supports(Class<?> authentication){
		return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
	}

	private UserApp loadUserByEmail(String email) {
		return userAppRepository.findByCredentialsEmail(email)
				.orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS));
	}

	private void validateAuthentication(Authentication authentication, UserApp user){
		if(!passwordEncoder.matches(authentication.getCredentials().toString(), user.getPassword()))
			throw new BadCredentialsException(INVALID_CREDENTIALS);
	}
}
