package com.lacouf.rsbjwt.model.notification;

public enum NotificationType {
    CV_APPROVED(TargetType.CV, "CV Approved", "Your CV has been approved."),
    CV_REJECTED(TargetType.CV, "CV Rejected", null),
    CV_SUBMITTED_FOR_REVIEW(TargetType.CV, "New CV Pending Review", "A new CV has been submitted for review."),

    INTERNSHIP_OFFER_APPROVED(TargetType.INTERNSHIP_OFFER, "Internship Offer Approved", "Your internship offer has been approved."),
    INTERNSHIP_OFFER_REJECTED(TargetType.INTERNSHIP_OFFER, "Internship Offer Rejected", null),
    INTERNSHIP_SUBMITTED_FOR_REVIEW(TargetType.INTERNSHIP_OFFER, "New Internship Pending Review", "A new internship has been submitted for review."),
    NEW_INTERNSHIP_OFFER(TargetType.INTERNSHIP_OFFER, "New Internship Offer", "A new internship offer has been posted that matches your discipline."),

    NEW_INTERNSHIP_APPLICATION(TargetType.INTERNSHIP_APPLICATION, "New Internship Application", "A student has applied to one of your internship offers."),
    INTERNSHIP_OFFERED(TargetType.INTERNSHIP_APPLICATION, "You're Hired", "Congratulations! %s wants to hire you for the internship \"%s\"."),
    INTERNSHIP_OFFER_REFUSED(TargetType.INTERNSHIP_APPLICATION, "Internship Offer Refused", "A student has refused your internship offer."),
    INTERVIEW_CONVOCATION(TargetType.INTERVIEW, "Interview Invitation", "You have been invited to an interview."),
    INTERVIEW_UPDATED(TargetType.INTERVIEW, "Interview Updated", "Your interview details have been updated."),
    INTERVIEW_REFUSED(TargetType.INTERVIEW, "Interview Refused", "A student has refused your interview invitation."),
    INTERVIEW_CANCELLED_STUDENT_HIRED(TargetType.INTERVIEW, "Interview Cancelled", "An interview was cancelled because the student was hired elsewhere."),

    STUDENT_ACCESS_REQUESTED(TargetType.STUDENT_ACCOUNT, "Student Access Requested", null),

    CONTRACT_TO_SIGN_BY_MANAGER(TargetType.CONTRACT, ContractToSign.TITLE, ContractToSign.MESSAGE),
    CONTRACT_TO_SIGN_BY_EMPLOYER(TargetType.CONTRACT, ContractToSign.TITLE, ContractToSign.MESSAGE),
    CONTRACT_TO_SIGN_BY_STUDENT(TargetType.CONTRACT, ContractToSign.TITLE, ContractToSign.MESSAGE),

    WORKPLACE_EVALUATION_TO_FILL(TargetType.WORKPLACE_EVALUATION, EvaluationTitles.TO_FILL, "A workplace evaluation is waiting for you."),
    WORKPLACE_EVALUATION_SIGNED(TargetType.WORKPLACE_EVALUATION, EvaluationTitles.COMPLETED, "A teacher has completed a workplace evaluation.");

    private final TargetType targetType;
    private final String title;
    private final String message;

    NotificationType(TargetType targetType, String title, String message) {
        this.targetType = targetType;
        this.title = title;
        this.message = message;
    }

    public TargetType getTargetType() {
        return targetType;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    private static final class ContractToSign {
        private static final String TITLE = "New Contract To Sign";
        private static final String MESSAGE = "A new internship contract is waiting for your signature.";
    }

    private static final class EvaluationTitles {
        private static final String TO_FILL = "New Evaluation To Fill";
        private static final String COMPLETED = "Evaluation Completed";
    }
}
