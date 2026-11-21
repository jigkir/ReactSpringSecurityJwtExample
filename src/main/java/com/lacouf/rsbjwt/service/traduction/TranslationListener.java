package com.lacouf.rsbjwt.service.traduction;

import com.lacouf.rsbjwt.service.traduction.Internship.InternshipChangedEvent;
import com.lacouf.rsbjwt.service.traduction.Internship.InternshipTranslationService;
import com.lacouf.rsbjwt.service.traduction.cv.CVChangedEvent;
import com.lacouf.rsbjwt.service.traduction.cv.CVTranslationService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TranslationListener {
    private final InternshipTranslationService internshipTranslationService;
    private final CVTranslationService cvTranslationService;

    public TranslationListener(InternshipTranslationService internshipTranslationService, CVTranslationService cvTranslationService) {
        this.internshipTranslationService = internshipTranslationService;
        this.cvTranslationService = cvTranslationService;
    }

    @Async("translationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(InternshipChangedEvent event) {
        internshipTranslationService.translateAndSave(event);
    }

    @Async("translationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(CVChangedEvent  event) {
        cvTranslationService.translateAndSave(event);
    }
}
