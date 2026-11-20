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

    public void translateAndSave(CVChangedEvent event) {
        Map<String, TranslatedContent> newOnes = new HashMap<>();

        String sample = event.rejectionMessage();
        Optional<String> detected = translator.detectLanguage(sample);
        if (detected.isEmpty()) return;
        String sourceLanguage = detected.get();

        for (String lang : LANGS) {
            var rejectionMessage = translator.translate(event.rejectionMessage(), sourceLanguage, lang);
            if (rejectionMessage.isEmpty()) return;

            newOnes.put(lang, new TranslatedContent(rejectionMessage.get()));
        }

        tx.executeWithoutResult((status ->
                cvRepository.findById(event.cvId())
                        .ifPresent(cv -> cv.replaceTranslations(newOnes))));
    }

    @Scheduled(fixedDelay = 60_000)
    public void retryPending() {
        List<CVChangedEvent> pending = tx.execute(status ->
                cvRepository.findByTranslationStatusAndVisibility(TranslationStatus.PENDING, DocumentVisibility.VISIBLE)
                        .stream().map(CVChangedEvent::of).toList());

        if (pending != null) pending.forEach(this::translateAndSave);
    }
}
