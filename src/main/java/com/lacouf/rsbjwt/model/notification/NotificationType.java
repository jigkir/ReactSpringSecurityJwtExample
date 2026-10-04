package com.lacouf.rsbjwt.model.notification;

public enum NotificationType {
    CV_APPROVED(TargetType.CV),
    CV_REJECTED(TargetType.CV),
    CV_SUBMITTED_FOR_REVIEW(TargetType.CV),

    NEW_INTERNSHIP_OFFER(TargetType.INTERNSHIP_OFFER);

    private final TargetType targetType;

    NotificationType(TargetType targetType) {
        this.targetType = targetType;
    }

    public TargetType getTargetType() {
        return targetType;
    }
}
