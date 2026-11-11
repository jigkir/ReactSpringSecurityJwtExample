package com.lacouf.rsbjwt.service.traduction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TraductionService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .build();
    private final String LIBRE_URL = "http://localhost:5000/translate";
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String normalizeLang(String lang) {
        if (lang == null || lang.isBlank()) return null;
        String code = lang.toLowerCase().split("[-_,;]")[0].trim(); // fr-CA -> fr
        return (code.equals("fr") || code.equals("en")) ? code : null;
    }

    public String traductStringToLanguage(String text, String targetLang) {
        String target = normalizeLang(targetLang);
        if (text == null || text.isBlank() || target == null) {
            return text;
        }

        String result = callLibre(text, "auto", target);

        // Short text: auto-detect often fails and returns the input unchanged
        if (result.trim().equalsIgnoreCase(text.trim())) {
            String otherLang = target.equals("en") ? "fr" : "en";
            result = callLibre(text, otherLang, target);
        }
        return result;
    }

    private String callLibre(String text, String source, String target) {
        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "q", text,
                    "source", source,
                    "target", target,
                    "format", "text"
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(LIBRE_URL))
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
        } catch (Exception e) {
            e.printStackTrace();
        }
        return text;
    }

    public List<InternshipResponseDto> translateInternships(List<InternshipResponseDto> dtos, String targetLang) {
        if (dtos == null || dtos.isEmpty() || normalizeLang(targetLang) == null) {
            return dtos;
        }

        List<InternshipResponseDto> translatedDtos = new ArrayList<>();
        for (InternshipResponseDto dto : dtos) {
            try {
                translatedDtos.add(new InternshipResponseDto(
                        dto.id(),
                        traductStringToLanguage(dto.title(), targetLang),
                        traductStringToLanguage(dto.description(), targetLang),
                        traductStringToLanguage(dto.requiredSkills(), targetLang),
                        dto.durationInWeeks(),
                        traductStringToLanguage(dto.location(), targetLang),
                        dto.workMode(),
                        dto.startDate(),
                        dto.applicationDeadline(),
                        dto.compensationAmount(),
                        dto.compensationNegotiable(),
                        dto.status(),
                        traductStringToLanguage(dto.rejectionComment(),  targetLang),
                        dto.employerId(),
                        dto.employerEmail(),
                        dto.discipline(),
                        dto.uploadedAt()
                ));
            } catch (Exception e) {
                translatedDtos.add(dto);
            }
        }
        return translatedDtos;
    }
}