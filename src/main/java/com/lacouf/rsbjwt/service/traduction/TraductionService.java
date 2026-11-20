package com.lacouf.rsbjwt.service.traduction;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.util.Optional;

@Service
public class TraductionService {
    private static final Logger log = LoggerFactory.getLogger(TraductionService.class);
    private final LibreTranslateClient client;

    public TraductionService(LibreTranslateClient client) { this.client = client; }

    public Optional<String> translate(String text, String target) {
        if (text == null || text.isBlank() || text.chars().noneMatch(Character::isLetter)) {
            return Optional.of(text == null ? "" : text);
        }
        try {
            var res = client.translate(new LibreTranslateClient.LibreRequest(text, "auto", target, "text"));
            return Optional.ofNullable(res.translatedText());
        } catch (RestClientException e) {
            log.warn("LibreTranslate failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public static String normalizeLang(String lang) {
        if (lang == null || lang.isBlank()) return null;
        String code = lang.toLowerCase().split("[-_,;]")[0].trim();
        return (code.equals("fr") || code.equals("en")) ? code : null;
    }
}