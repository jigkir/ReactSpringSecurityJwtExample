package com.lacouf.rsbjwt.model.internship_tracking;

import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;
import jakarta.persistence.*;

@Entity
public class InternshipTracking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "internship_id", nullable = false)
    private Internship internship;

    protected InternshipTracking() {}

    public InternshipTracking(Student student, Internship internship) {
        this.student = student;
        this.internship = internship;
    }

    public void assignTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public boolean hasTeacher() {
        return teacher != null;
    }
}
