package com.lacouf.rsbjwt;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.service.ManagerService;
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

    private final ManagerService managerService;
    private final DataSourceProperties dataSourceProperties;

    public ReactSpringSecurityJwtApplication(ManagerService managerService, DataSourceProperties dataSourceProperties) {
        this.managerService = managerService;
        this.dataSourceProperties = dataSourceProperties;
    }

    static void main(String[] args) {
        SpringApplication.run(ReactSpringSecurityJwtApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        configureTcpServer();

        IO.println(managerService.save("John", "Doe", "manager@email.com", "Password123#", "0123456789"));
    }

    private void configureTcpServer() throws SQLException {
        String databaseUrl = dataSourceProperties.getUrl();
        int lastIndex = databaseUrl.lastIndexOf(':');
        databaseUrl = databaseUrl.substring(lastIndex + 1);

        TcpServer.createTcpServer(9092, databaseUrl);
    }
}
