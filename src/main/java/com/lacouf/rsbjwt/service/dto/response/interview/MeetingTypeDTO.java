package com.lacouf.rsbjwt.service.dto.response.interview;

import com.lacouf.rsbjwt.model.interview.MeetingType;

import java.util.List;

public record MeetingTypeDTO(List<String> meetingTypes) {
    public static MeetingTypeDTO of(List<MeetingType> meetingTypes) {
        return new MeetingTypeDTO(meetingTypes.stream().map(MeetingType::name).toList());
    }
}