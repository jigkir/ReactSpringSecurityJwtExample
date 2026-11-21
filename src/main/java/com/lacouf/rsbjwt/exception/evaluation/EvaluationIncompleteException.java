package com.lacouf.rsbjwt.exception.evaluation;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class EvaluationIncompleteException extends APIException {
    public EvaluationIncompleteException(long evaluationId) {
        super(HttpStatus.BAD_REQUEST, "Evaluation " + evaluationId + " must be complete before it is signed.");
    }
}
