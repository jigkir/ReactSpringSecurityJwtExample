package com.lacouf.rsbjwt.model.internship_tracking;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
public class InternshipTracking {

    @Getter
    @Setter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Getter
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Getter
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "internship_id", nullable = false)
    private Internship internship;

    @Getter
    @OneToOne(mappedBy = "tracking", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY, optional = false)
    private WorkplaceEvaluation workplaceEvaluation;

    protected InternshipTracking() {
    }

    public InternshipTracking(Contract contract) {
        this.student = contract.getStudent();
        this.internship = contract.getInternship();
        this.workplaceEvaluation = new WorkplaceEvaluation(this);
    }

    public void assignTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public boolean hasTeacher() {
        return teacher != null;
    }
}
