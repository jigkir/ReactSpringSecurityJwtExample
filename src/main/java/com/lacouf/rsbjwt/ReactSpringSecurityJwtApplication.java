package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.ManagerService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReactSpringSecurityJwtApplication implements CommandLineRunner {

    private final ManagerService managerService;
    private final UserAppRepository userAppRepository;

    private static final String MANAGER_EMAIL = "manager@email.com";

    public ReactSpringSecurityJwtApplication(ManagerService managerService, UserAppRepository userAppRepository) {
        this.managerService = managerService;
        this.userAppRepository = userAppRepository;
    }

    static void main(String[] args) {
        SpringApplication.run(ReactSpringSecurityJwtApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        if (userAppRepository.findByCredentialsEmail(MANAGER_EMAIL).isPresent()) return;

        managerService.save("John", "Doe", "manager@email.com", "Password123#", "0123456789");
    }
}
