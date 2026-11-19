package com.lacouf.rsbjwt.service.traduction;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class InternshipTranslationListener {
    private final InternshipTranslationService service;

    public InternshipTranslationListener(InternshipTranslationService service) {
        this.service = service;
    }

    @Async("translationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(InternshipChangedEvent event) {
        service.translateAndSave(event);
    }
}
