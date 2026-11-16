package com.lacouf.rsbjwt.exception.internship_tracking;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class TeacherDisciplineMismatchException extends APIException {
    public TeacherDisciplineMismatchException(long teacherId, long trackingId) {
        super(HttpStatus.CONFLICT, "Student in Internship Tracking " + trackingId + " is not of same discipline as teacher " + teacherId);
    }
}
