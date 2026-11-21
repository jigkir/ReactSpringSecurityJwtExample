package com.lacouf.rsbjwt.exception.evaluation;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class EvaluationNotFoundException extends APIException {
    public EvaluationNotFoundException(long evaluationId) {
        super(HttpStatus.NOT_FOUND, "Evaluation not found with id: " + evaluationId);
    }
}
