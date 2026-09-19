package com.lacouf.rsbjwt.service.dto;


public record JWTAuthResponse(String tokenType, String accessToken) {
    public JWTAuthResponse(String accessToken) {
        this("BEARER", accessToken);
    }
}