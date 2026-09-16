package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.CV;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
}
