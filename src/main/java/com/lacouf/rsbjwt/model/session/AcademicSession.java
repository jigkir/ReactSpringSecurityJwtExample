package com.lacouf.rsbjwt.model.session;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"season", "sessionYear"}))
public class AcademicSession {
    @Id
    @Setter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Season season;

    @Column(nullable = false)
    private int sessionYear;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    public AcademicSession(Season season, int sessionYear) {
        this.season = season;
        this.sessionYear = sessionYear;
        this.startDate = season.firstDayIn(sessionYear);
        this.endDate = season.lastDayIn(sessionYear);
    }

    public String getName() {
        return season.getCode() + sessionYear;
    }

    public int getAcademicYear() {
        return season == Season.FALL ? sessionYear : sessionYear - 1;
    }
}