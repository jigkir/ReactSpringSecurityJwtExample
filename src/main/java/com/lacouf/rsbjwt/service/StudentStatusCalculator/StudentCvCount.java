package com.lacouf.rsbjwt.service.StudentStatusCalculator;

import com.lacouf.rsbjwt.model.ReviewStatus;

public interface StudentCvCount {
    Long getStudentId();
    ReviewStatus getStatus();
    Long getTotal();
}
