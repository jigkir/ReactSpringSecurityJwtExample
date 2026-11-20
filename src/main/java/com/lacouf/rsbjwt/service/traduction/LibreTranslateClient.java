package com.lacouf.rsbjwt.service.traduction;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;

import java.util.List;

public interface LibreTranslateClient {

    @PostExchange("/translate")
    LibreResponse translate(@RequestBody LibreRequest request);

    record LibreRequest(String q, String source, String target, String format) {}
    record LibreResponse(String translatedText) {}

    @PostExchange("/detect")
    List<DetectResult> detect(@RequestBody DetectRequest request);

    record DetectRequest(String q) {}
    record DetectResult(double confidence, String language) {}
}