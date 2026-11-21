package com.lacouf.rsbjwt.service.evaluation;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class EvaluationService {
    private final UserAppService userAppService;
    private final Clock clock;

    public EvaluationService(UserAppService userAppService, Clock clock) {
        this.userAppService = userAppService;
        this.clock = clock;
    }

    public LocalDateTime getUpdateTime(Evaluation evaluation) throws EvaluationAlreadySignedException {
        verifyIfAlreadySigned(evaluation);

        return LocalDateTime.now(clock);
    }

    public void sign(Evaluation evaluation, String email, String password) throws UserNotFoundException, IncorrectSignaturePasswordException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        userAppService.verifyIfSignaturePasswordIsIncorrect(userAppService.findUserByEmail(email), password);

        signWithoutPassword(evaluation);
    }

    public void signWithoutPassword(Evaluation evaluation) throws EvaluationAlreadySignedException, EvaluationIncompleteException {
        verifyIfAlreadySigned(evaluation);
        verifyIfIncomplete(evaluation);

        evaluation.sign(LocalDateTime.now(clock));
    }

    private void verifyIfAlreadySigned(Evaluation evaluation) throws EvaluationAlreadySignedException {
        if (evaluation.isSigned()) {
            throw new EvaluationAlreadySignedException(evaluation.getId());
        }
    }

    private void verifyIfIncomplete(Evaluation evaluation) throws EvaluationIncompleteException {
        if (!evaluation.isComplete()) {
            throw new EvaluationIncompleteException(evaluation.getId());
        }
    }
}
