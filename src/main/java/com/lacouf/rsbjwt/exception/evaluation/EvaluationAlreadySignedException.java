package com.lacouf.rsbjwt.exception.evaluation;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class EvaluationAlreadySignedException extends APIException {
    public EvaluationAlreadySignedException(long evaluationId) {
        super(HttpStatus.CONFLICT, "Evaluation " + evaluationId + " is already signed and can no longer be changed.");
    }
}
