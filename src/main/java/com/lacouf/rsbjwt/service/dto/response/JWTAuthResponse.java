package com.lacouf.rsbjwt.service.dto.response;


public record JWTAuthResponse(String tokenType, String accessToken) {
    public JWTAuthResponse(String accessToken) {
        this("BEARER", accessToken);
    }
}