package com.lacouf.rsbjwt.repository.users;

import com.lacouf.rsbjwt.model.user.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAppRepository extends JpaRepository<UserApp, Long> {
    Optional<UserApp> findByCredentialsEmail(String email);
}
