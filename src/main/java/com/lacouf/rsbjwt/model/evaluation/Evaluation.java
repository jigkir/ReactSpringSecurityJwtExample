package com.lacouf.rsbjwt.model.evaluation;

import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Map;

@Getter
@MappedSuperclass
public abstract class Evaluation {
    public static final int MAX_TEXT_LENGTH = 2000;

    @Id
    @Setter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tracking_id", nullable = false, unique = true)
    private InternshipTracking tracking;

    private LocalDateTime updatedAt;

    private LocalDateTime signedAt;

    protected Evaluation() {
    }

    protected Evaluation(InternshipTracking tracking) {
        this.tracking = tracking;
    }

    public abstract boolean isComplete();

    public abstract NotificationType getToFillNotification();

    public abstract NotificationType getSignedNotification();

    public boolean isSigned() {
        return signedAt != null;
    }

    public void sign(LocalDateTime signedAt) {
        this.signedAt = signedAt;
    }

    protected void markAsUpdated(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    protected static <C extends Enum<C>> boolean ratesEvery(Class<C> criteria, Map<C, AgreementLevel> ratings) {
        return ratings.keySet().containsAll(EnumSet.allOf(criteria));
    }

    protected static <K, V> void replaceAnswers(Map<K, V> answers, Map<K, V> newAnswers) {
        answers.clear();

        newAnswers.forEach((key, answer) -> {
            if (answer != null) {
                answers.put(key, answer);
            }
        });
    }

    protected static boolean hasText(String text) {
        return text != null && !text.isBlank();
    }
}
