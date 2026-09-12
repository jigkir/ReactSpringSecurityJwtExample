package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserAppRepository extends JpaRepository<UserApp, Long> {

    @Query("""
        select u from UserApp u where trim(lower(u.credentials.email)) = :email
    """)
    Optional<UserApp> findUserAppByEmail(@Param("email") String email);

    UserApp findByCredentialsEmail(String email);
}
