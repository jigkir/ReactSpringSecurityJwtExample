package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.EmprunteurRepository;
import com.lacouf.rsbjwt.repository.GestionnaireRepository;
import com.lacouf.rsbjwt.repository.PreposeRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.util.TcpServer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Optional;

@SpringBootApplication
public class ReactSpringSecurityJwtApplication implements CommandLineRunner {

    private final GestionnaireRepository gestionnaireRepository;
    private final EmprunteurRepository emprunteurRepository;
    private final PreposeRepository preposeRepository;
    private final UserAppRepository userAppRepository;

    private final PasswordEncoder passwordEncoder;

    private final DataSourceProperties dataSourceProperties;

    public ReactSpringSecurityJwtApplication(GestionnaireRepository gestionnaireRepository, EmprunteurRepository emprunteurRepository, PreposeRepository preposeRepository, UserAppRepository userAppRepository, PasswordEncoder passwordEncoder, DataSourceProperties dataSourceProperties) {
        this.gestionnaireRepository = gestionnaireRepository;
        this.emprunteurRepository = emprunteurRepository;
        this.preposeRepository = preposeRepository;
        this.userAppRepository = userAppRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSourceProperties = dataSourceProperties;
    }

    public static void main(String[] args) {
        SpringApplication.run(ReactSpringSecurityJwtApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        configureTcpServer();

        gestionnaireRepository.save(
                Gestionnaire.builder()
                        .firstName("Gerard")
                        .lastName("Biblio")
                        .email("l@l.com")
                        .password(passwordEncoder.encode("bib"))
                        .matricule("0000001")
                        .phoneNumber("123-456-7890")
                        .build()
        );
        emprunteurRepository.save(
                Emprunteur.builder()
                        .firstName("Isidor")
                        .lastName("Teurteur")
                        .email("ll@l.com")
                        .password(passwordEncoder.encode("bib"))
                        .since(LocalDate.of(2020, 10,20))
                        .build()
        );
        preposeRepository.save(
                Prepose.builder()
                        .firstName("Chandeuse")
                        .lastName("Lixor")
                        .email("lll@l.com")
                        .password(passwordEncoder.encode("bib"))
                        .passeKey("12345")
                        .build()
        );
        final Optional<UserApp> userAppByEmail = userAppRepository.findUserAppByEmail("l@l.com");
        userAppByEmail.ifPresent(userApp -> System.out.println("user " + userAppByEmail));

    }

    private void configureTcpServer() throws SQLException {
        String databaseUrl = dataSourceProperties.getUrl();
        int lastIndex = databaseUrl.lastIndexOf(':');
        databaseUrl = databaseUrl.substring(lastIndex + 1);

        TcpServer.createTcpServer(9092, databaseUrl);
    }
}
