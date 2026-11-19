package com.lacouf.rsbjwt.service.traduction;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;

public interface LibreTranslateClient {

    @PostExchange("/translate")
    LibreResponse translate(@RequestBody LibreRequest request);

    record LibreRequest(String q, String source, String target, String format) {}
    record LibreResponse(String translatedText) {}
}