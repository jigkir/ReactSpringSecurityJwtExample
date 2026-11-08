package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import com.lacouf.rsbjwt.service.users.ManagerService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReactSpringSecurityJwtApplication implements CommandLineRunner {

    private final ManagerService managerService;
    private final UserAppRepository userAppRepository;
    private final AcademicSessionService academicSessionService;

    private static final String MANAGER_EMAIL = "gestion.stages@claurendeau.qc.ca";

    public ReactSpringSecurityJwtApplication(ManagerService managerService, UserAppRepository userAppRepository, AcademicSessionService academicSessionService) {
        this.managerService = managerService;
        this.userAppRepository = userAppRepository;
        this.academicSessionService = academicSessionService;
    }

    static void main(String[] args) {
        SpringApplication.run(ReactSpringSecurityJwtApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        academicSessionService.getTargetSession();

        if (userAppRepository.findByCredentialsEmail(MANAGER_EMAIL).isPresent()) return;

        managerService.save("John", "Doe", MANAGER_EMAIL, "John123#", "4505550000");
    }
}
