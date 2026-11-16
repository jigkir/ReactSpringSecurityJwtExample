package com.lacouf.rsbjwt.service.traduction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import org.springframework.stereotype.Service;

import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class TraductionService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String LIBRE_URL = "http://localhost:5000/translate";

    private static final long RETRY_AFTER_MS = 30_000;
    private volatile long unavailableUntil = 0;

    private boolean isAvailable() {
        return System.currentTimeMillis() >= unavailableUntil;
    }

    private void markUnavailable() {
        boolean firstTime = isAvailable();
        unavailableUntil = System.currentTimeMillis() + RETRY_AFTER_MS;
        if (firstTime) {
            System.err.println("LibreTranslate unavailable (" + "cannot connect" + "), translation disabled for "
                    + (RETRY_AFTER_MS / 1000) + "s");
        }
    }

    private String callLibre(String text, String source, String target) {
        if (!isAvailable()) {
            return text;
        }

        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "q", text,
                    "source", source,
                    "target", target,
                    "format", "text"
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(LIBRE_URL))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode node = objectMapper.readTree(response.body());
                if (node.has("translatedText")) {
                    return node.get("translatedText").asText();
                }
            } else {
                System.err.println("LibreTranslate error " + response.statusCode() + ": " + response.body());
            }
        } catch (ConnectException | HttpConnectTimeoutException e) {
            markUnavailable();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            System.err.println("LibreTranslate call failed: " + e.getMessage());
        }
        return text;
    }

    public boolean needsTranslation(String text) {
        if (text == null || text.isBlank()) return false;
        return text.chars().anyMatch(Character::isLetter);
    }

    private String normalizeLang(String lang) {
        if (lang == null || lang.isBlank()) return null;
        String code = lang.toLowerCase().split("[-_,;]")[0].trim();
        return (code.equals("fr") || code.equals("en")) ? code : null;
    }

    public String traductStringToLanguage(String text, String targetLang) {
        if (!needsTranslation(text)) {
            return text;
        }
        String target = normalizeLang(targetLang);
        if (target == null) {
            return text;
        }

        String source = target.equals("en") ? "fr" : "en";
        return callLibre(text, source, target);
    }

    public List<InternshipResponseDto> translateInternships(List<InternshipResponseDto> dtos, String targetLang) {
        if (dtos == null || dtos.isEmpty() || normalizeLang(targetLang) == null) {
            return dtos;
        }

        return dtos.stream()
                .map(dto -> needsTranslation(dto.rejectionComment())
                        ? withRejectionComment(dto, traductStringToLanguage(dto.rejectionComment(), targetLang))
                        : dto)
                .toList();
    }

    private InternshipResponseDto withRejectionComment(InternshipResponseDto dto, String comment) {
        return new InternshipResponseDto(
                dto.id(), dto.title(), dto.description(), dto.requiredSkills(),
                dto.durationInWeeks(), dto.location(), dto.workMode(), dto.startDate(),
                dto.applicationDeadline(), dto.compensationAmount(), dto.compensationNegotiable(),
                dto.status(), comment, dto.employerId(), dto.employerEmail(),
                dto.discipline(), dto.uploadedAt());
    }
}