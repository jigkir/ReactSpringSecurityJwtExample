package com.lacouf.rsbjwt.model.notification;

public enum NotificationType {
    CV_APPROVED(TargetType.CV, "CV Approved", "Your CV has been approved."),
    CV_REJECTED(TargetType.CV, "CV Rejected", null),
    CV_SUBMITTED_FOR_REVIEW(TargetType.CV, "New CV Pending Review", "A new CV has been submitted for review."),

    NEW_INTERNSHIP_OFFER(TargetType.INTERNSHIP_OFFER, "New Internship Offer", "A new internship offer has been posted that matches your discipline.");

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
}
