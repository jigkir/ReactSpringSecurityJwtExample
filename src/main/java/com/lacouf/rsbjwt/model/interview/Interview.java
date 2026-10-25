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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(unique = true)
    private InternshipApplication internshipApplication;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentDecision studentDecision;

    @Column(nullable = false)
    private LocalDateTime interviewDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MeetingType meetingType;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InterviewStatus interviewStatus;

    @Column(nullable = false)
    private String meetingDetails;

    public Interview() {
    }

    public Interview(Employer employer, InternshipApplication internshipApplication, String message, LocalDateTime interviewDate, MeetingType meetingType, String meetingDetails) {
        this.employer = employer;
        this.internshipApplication = internshipApplication;
        this.studentDecision = StudentDecision.PENDING;
        this.message = message;
        this.interviewDate = interviewDate;
        this.meetingType = meetingType;
        this.meetingDetails = meetingDetails;
        this.interviewStatus = InterviewStatus.SCHEDULED;
    }

    public void update(String message, LocalDateTime interviewDate, MeetingType meetingType, String meetingDetails) {
        this.message = message;
        this.interviewDate = interviewDate;
        this.meetingType = meetingType;
        this.meetingDetails = meetingDetails;
        this.studentDecision = StudentDecision.PENDING;
    }

    public void cancel() {
        this.interviewStatus = InterviewStatus.CANCELLED;
    }
}
