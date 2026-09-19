package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.InvalidJwtTokenException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokenProvider;
    private final UserAppRepository userRepository;

    private static final String BEARER_PREFIX = "Bearer ";

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserAppRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token = getJWTFromRequest(request);

        if (StringUtils.hasText(token)) {
            try {
                authenticateUser(request, token);
            } catch (InvalidJwtTokenException | UserNotFoundException e) {
                SecurityContextHolder.clearContext();
                logger.debug("JWT authentication failed: " + e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    private void authenticateUser(HttpServletRequest request, String token) {
        String email = tokenProvider.getEmailFromJWT(token);
        UserApp user = userRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);

        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                user.getEmail(), null, user.getAuthorities()
        );
        authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    }

    private String getJWTFromRequest(HttpServletRequest request) {
        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith(BEARER_PREFIX)) {
            return authorizationHeader.substring(BEARER_PREFIX.length());
        }

        return null;
    }

}
