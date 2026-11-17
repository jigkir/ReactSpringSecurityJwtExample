package com.lacouf.rsbjwt.service.dto.response.internship_tracking;

import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.StudentSummaryDto;
import com.lacouf.rsbjwt.service.dto.response.user.TeacherSummaryDto;

public record InternshipTrackingResponseDto(long id, StudentSummaryDto student, InternshipResponseDto internship, TeacherSummaryDto teacher) {

    public static InternshipTrackingResponseDto of(InternshipTracking tracking) {
        return new InternshipTrackingResponseDto(
                tracking.getId(),
                StudentSummaryDto.of(tracking.getStudent()),
                InternshipResponseDto.of(tracking.getInternship()),
                tracking.hasTeacher() ? TeacherSummaryDto.of(tracking.getTeacher()) : null
        );
    }
}
