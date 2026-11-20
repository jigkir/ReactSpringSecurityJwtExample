package com.lacouf.rsbjwt.service.traduction.cv;

import com.lacouf.rsbjwt.model.TranslationStatus;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.cv.TranslatedContent;
import com.lacouf.rsbjwt.repository.document.student.cv.CVRepository;
import com.lacouf.rsbjwt.service.traduction.TraductionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CVTranslationService {
    private static final List<String> LANGS = List.of("fr", "en");

    private final TraductionService translator;
    private final CVRepository cvRepository;
    private final TransactionTemplate tx;

    public CVTranslationService(TraductionService translator, CVRepository cvRepository, TransactionTemplate tx) {
        this.translator = translator;
        this.cvRepository = cvRepository;
        this.tx = tx;
    }

    public boolean translateAndSave(CVChangedEvent event) {
        String comment = event.rejectionMessage();

        if (comment == null || comment.isBlank() || comment.chars().noneMatch(Character::isLetter)) {
            tx.executeWithoutResult(status ->
                    cvRepository.findById(event.cvId())
                            .ifPresent(cv -> cv.replaceTranslations(new HashMap<>())));
            return true;
        }

        Optional<String> detected = translator.detectLanguage(comment);
        if (detected.isEmpty()) return false;
        String sourceLanguage = detected.get();

        Map<String, TranslatedContent> newOnes = new HashMap<>();
        for (String lang : LANGS) {
            var translated = translator.translate(comment, sourceLanguage, lang);
            if (translated.isEmpty()) return false;

            newOnes.put(lang, new TranslatedContent(translated.get()));
        }

        tx.executeWithoutResult(status ->
                cvRepository.findById(event.cvId())
                        .ifPresent(cv -> cv.replaceTranslations(newOnes)));
        return true;
    }

    @Scheduled(fixedDelay = 60_000)
    public void retryPending() {
        List<CVChangedEvent> pending = tx.execute(status ->
                cvRepository.findByTranslationStatusAndVisibility(TranslationStatus.PENDING, DocumentVisibility.VISIBLE)
                        .stream().map(CVChangedEvent::of).toList());

        if (pending == null) return;
        for (CVChangedEvent event : pending) {
            if (!translateAndSave(event)) return;
        }
    }
}
