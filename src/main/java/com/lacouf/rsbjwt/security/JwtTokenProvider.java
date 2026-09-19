package com.lacouf.rsbjwt.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import com.lacouf.rsbjwt.security.exception.InvalidJwtTokenException;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HexFormat;

@Component
public class JwtTokenProvider {
    private final long expirationInMs;
    private final SecretKey jwtSecret;

    public JwtTokenProvider(@Value("${application.security.jwt.expiration}") long expirationInMs, @Value("${application.security.jwt.secret-key}") String jwtSecret) {
        this.expirationInMs = expirationInMs;

        byte[] keyBytes = HexFormat.of().parseHex(jwtSecret);
        this.jwtSecret = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        long nowMillis = System.currentTimeMillis();

        return Jwts.builder()
                .subject(authentication.getName())
                .issuedAt(new Date(nowMillis))
                .expiration(new Date(nowMillis + expirationInMs))
                .signWith(jwtSecret)
                .compact();
    }

    public String getEmailFromJWT(String token) {
        return parseClaims(token).getSubject();
    }

    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(jwtSecret)
                    .build()
                    .parseSignedClaims(token)
					.getPayload();
        } catch (ExpiredJwtException ex) {
            throw new InvalidJwtTokenException(HttpStatus.UNAUTHORIZED, "Expired JWT token");
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidJwtTokenException(HttpStatus.BAD_REQUEST, "Invalid JWT token");
        }
    }
}
