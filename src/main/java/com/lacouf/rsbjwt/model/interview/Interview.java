package com.lacouf.rsbjwt.model.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.user.Employer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
public class Interview {
    @Id
    @Setter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Employer employer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private InternshipApplication internshipApplication;

    @Column(nullable = false)
    private String message;

    @Column
    private String interviewPhoneNumber;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentDecision studentDecision;

    @Setter
    @Column
    private String rejectionMessage;

    @Setter
    @Column(nullable = false)
    private LocalDateTime interviewDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MeetingType meetingType;

    @Getter
    @Setter
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InterviewStatus interviewStatus;

    @Enumerated(EnumType.STRING)
    private InterviewCancellationReason cancellationReason;

    @Column(nullable = false)
    private String meetingDetails;

    public Interview() {
    }

    public Interview(Employer employer, InternshipApplication internshipApplication, String interviewPhoneNumber, String message, LocalDateTime interviewDate, MeetingType meetingType, String meetingDetails) {
        this.employer = employer;
        this.internshipApplication = internshipApplication;
        this.interviewPhoneNumber = interviewPhoneNumber;
        this.studentDecision = StudentDecision.PENDING;
        this.message = message;
        this.interviewDate = interviewDate;
        this.meetingType = meetingType;
        this.meetingDetails = meetingDetails;
        this.interviewStatus = InterviewStatus.SCHEDULED;
        this.rejectionMessage = "";
    }

    public void update(String message, String interviewPhoneNumber, LocalDateTime interviewDate,
                       MeetingType meetingType, String meetingDetails) {
        this.message = message;
        this.interviewPhoneNumber = interviewPhoneNumber;
        this.interviewDate = interviewDate;
        this.meetingType = meetingType;
        this.meetingDetails = meetingDetails;
        this.studentDecision = StudentDecision.PENDING;
        this.rejectionMessage = "";
    }

    public void cancel(InterviewCancellationReason reason) {
        this.interviewStatus = InterviewStatus.CANCELLED;
        this.cancellationReason = reason;
    }
}
