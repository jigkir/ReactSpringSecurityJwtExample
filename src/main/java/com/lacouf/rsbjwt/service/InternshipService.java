package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.repository.InternshipRepository;
import com.lacouf.rsbjwt.security.exception.InternshipNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class InternshipService { //TODO put this in EmployerService
    private final InternshipRepository internshipRepository;

    public InternshipService(InternshipRepository internshipRepository) {
        this.internshipRepository = internshipRepository;
    }

    public Optional<Internship> getInternshipById(Long id) {
        return internshipRepository.findById(id);
    }


}
