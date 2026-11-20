package com.lacouf.rsbjwt.service.traduction;

import com.lacouf.rsbjwt.model.TranslationStatus;
import com.lacouf.rsbjwt.model.internship.TranslatedContent;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InternshipTranslationService {
    private static final List<String> LANGS = List.of("fr", "en");

    private final TraductionService translator;
    private final InternshipRepository internshipRepository;
    private final TransactionTemplate tx;

    public InternshipTranslationService(TraductionService translator,
                                        InternshipRepository internshipRepository,
                                        TransactionTemplate tx) {
        this.translator = translator;
        this.internshipRepository = internshipRepository;
        this.tx = tx;
    }

    public boolean translateAndSave(InternshipChangedEvent src) {
        Map<String, TranslatedContent> results = new HashMap<>();

        String sample = src.title() + ". " + src.description();
        Optional<String> detected = translator.detectLanguage(sample);
        if (detected.isEmpty()) return false;
        String source = detected.get();

        for (String lang : LANGS) {
            var title = translator.translate(src.title(), source, lang);
            if (title.isEmpty()) return false;
            var desc = translator.translate(src.description(), source, lang);
            if (desc.isEmpty()) return false;
            var rej = translator.translate(src.rejectionComment(), source, lang);
            if (rej.isEmpty()) return false;

            results.put(lang, new TranslatedContent(
                    title.get(), desc.get(), rej.filter(s -> !s.isEmpty()).orElse(null)));
        }

        tx.executeWithoutResult(status ->
                internshipRepository.findById(src.internshipId())
                        .ifPresent(i -> i.replaceTranslations(results)));
        return true;
    }

    @Scheduled(fixedDelay = 60_000)
    public void retryPending() {
        List<InternshipChangedEvent> pending = tx.execute(status ->
                internshipRepository.findByTranslationStatusAndDeletedFalse(TranslationStatus.PENDING)
                        .stream().map(InternshipChangedEvent::of).toList());

        if (pending != null) pending.forEach(this::translateAndSave);
    }
}
