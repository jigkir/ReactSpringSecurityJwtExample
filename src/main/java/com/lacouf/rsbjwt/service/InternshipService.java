package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.repository.InternshipRepository;
import com.lacouf.rsbjwt.security.exception.InternshipNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class InternshipService {
    private final InternshipRepository internshipRepository;

    public InternshipService(InternshipRepository internshipRepository) {
        this.internshipRepository = internshipRepository;
    }

    public List<Internship> getAllActiveInternships() {
        return internshipRepository.findByIsDeletedFalse();
    }

    public List<Internship> getInternshipsByEmployerName(Long employerId) {
        return internshipRepository.findByPostedBy_IdAndIsDeletedIsFalse(employerId);
    }

    public Optional<Internship> getInternshipById(Long id) {
        return internshipRepository.findById(id);
    }

    public Internship saveInternship(Internship internship) {
        return internshipRepository.save(internship);
    }

    public Internship deleteInternship(Long id) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new InternshipNotFoundException("Internship not found with id: " + id));

        internship.setIsDeleted(true);
        return internshipRepository.save(internship);
    }
}
