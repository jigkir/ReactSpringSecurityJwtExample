package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

import static org.springframework.http.HttpMethod.*;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize, @PostAuthorize, etc.
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserAppRepository userRepository;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    // PUBLIC PATHS
    private static final String USER_LOGIN_PATH = "/api/login";
    private static final String DISCIPLINES_LIST_PATH = "/api/disciplines";
    private static final String ROLES_LIST_PATH = "/api/roles";
    private static final String USER_CV_MAX_SIZE_PATH = "/api/max-cv-size";

    // SIGN-UP PATHS
    private static final String STUDENT_SIGNUP_PATH = "/api/student/signup";
    private static final String TEACHER_SIGNUP_PATH = "/api/teacher/signup";
    private static final String EMPLOYER_SIGNUP_PATH = "/api/employer/signup";

    // LOGGED-IN USER PATH
    private static final String CURRENT_USER_PATH = "/api/users/current";

    // CV PATHS
    private static final String MAKE_CV_PUBLIC_PATH = "/api/student/{studentId}/cvs/{cvId}/public";
    private static final String MAKE_CV_PRIVATE_PATH = "/api/student/{studentId}/cvs/{cvId}/private";
    private static final String STUDENT_UPLOAD_CV_PATH = "/api/student/{studentId}/cvs";
    private static final String STUDENT_DOWNLOAD_CV_PATH = "/api/student/{studentId}/cvs/**";
    private static final String HIDE_CV_PATH = "/api/student/{studentId}/cvs/{cvId}/hide";
    private static final String GET_STUDENT_INTERNSHIPS_PATH = "/api/student/{studentId}/internships";
    private static final String MAIN_STUDENT_CV_PATH = "/api/student/{studentId}/cvs/{cvId}/main";
    private static final String SECONDARY_STUDENT_CV_PATH = "/api/student/{studentId}/cvs/{cvId}/secondary";
    private static final String STUDENT_CV_COUNT_PATH = "/api/student/{studentId}/cvs/count";
    private static final String STUDENT_CV_STATUS_PATH = "/api/student/{studentId}/cvs/{cvId}/status";

    // STUDENT NOTIFICATIONS PATHS
    private static final String STUDENT_NOTIFICATIONS_PATH = "/api/student/{studentId}/notifications";
    private static final String STUDENT_NOTIFICATION_READ_PATH = "/api/student/{studentId}/notifications/{notificationId}/read";
    private static final String STUDENT_NOTIFICATION_UNREAD_COUNT_PATH = "/api/student/{studentId}/notifications/unread/count";

    // INTERNSHIP PATHS
    private static final String EMPLOYER_INTERNSHIP_CREATION_PATH = "/api/employer/internship";
    private static final String EMPLOYER_INTERNSHIP_DELETION_PATH = "/api/employer/internships/{internshipId}";
    private static final String EMPLOYER_INTERNSHIPS_BY_ID_PATH = "/api/employer/{employerId}/internships";

    // MANAGER PATHS
    private static final String MANAGER_PATH = "/api/manager/**";
    private static final String MANAGER_NOTIFICATIONS_PATH = "/api/manager/notifications";
    private static final String MANAGER_NOTIFICATION_READ_PATH = "/api/manager/notifications/{notificationId}/read";
    private static final String MANAGER_APPROVE_CV_PATH = "/api/manager/cvs/{cvId}/approve";
    private static final String MANAGER_REJECT_CV_PATH = "/api/manager/cvs/{cvId}/reject";

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // PUBLIC
                        .requestMatchers(OPTIONS, "/**").permitAll() // Allow CORS preflight requests
                        .requestMatchers(POST, USER_LOGIN_PATH).permitAll()
                        .requestMatchers(GET, DISCIPLINES_LIST_PATH).permitAll()
                        .requestMatchers(GET, ROLES_LIST_PATH).permitAll()
                        .requestMatchers(GET, USER_CV_MAX_SIZE_PATH).permitAll()

                        // SIGN-UP
                        .requestMatchers(POST, STUDENT_SIGNUP_PATH).permitAll()
                        .requestMatchers(POST, TEACHER_SIGNUP_PATH).permitAll()
                        .requestMatchers(POST, EMPLOYER_SIGNUP_PATH).permitAll()

                        // LOGGED-IN USER
                        .requestMatchers(GET, CURRENT_USER_PATH).authenticated()

                        // STUDENT : NOTIFICATIONS
                        .requestMatchers(GET, STUDENT_NOTIFICATIONS_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(PUT, STUDENT_NOTIFICATION_READ_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(GET, STUDENT_NOTIFICATION_UNREAD_COUNT_PATH).hasAuthority(Role.STUDENT.name())


                        // STUDENT : CV
                        .requestMatchers(GET, STUDENT_UPLOAD_CV_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(GET, STUDENT_CV_COUNT_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(GET, STUDENT_CV_STATUS_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(GET, STUDENT_DOWNLOAD_CV_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(POST, STUDENT_UPLOAD_CV_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(PUT, MAKE_CV_PUBLIC_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(PUT, MAKE_CV_PRIVATE_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(PUT, HIDE_CV_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(PUT, MAIN_STUDENT_CV_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(PUT, SECONDARY_STUDENT_CV_PATH).hasAuthority(Role.STUDENT.name())

                        // EMPLOYER : INTERNSHIP
                        .requestMatchers(GET, GET_STUDENT_INTERNSHIPS_PATH).hasAuthority(Role.STUDENT.name())
                        .requestMatchers(POST, EMPLOYER_INTERNSHIP_CREATION_PATH).hasAuthority(Role.EMPLOYER.name())
                        .requestMatchers(DELETE, EMPLOYER_INTERNSHIP_DELETION_PATH).hasAuthority(Role.EMPLOYER.name())
                        .requestMatchers(GET, EMPLOYER_INTERNSHIPS_BY_ID_PATH).hasAuthority(Role.EMPLOYER.name())

                        // MANAGER
                        .requestMatchers(PUT, MANAGER_APPROVE_CV_PATH).hasAuthority(Role.MANAGER.name())
                        .requestMatchers(PUT, MANAGER_REJECT_CV_PATH).hasAuthority(Role.MANAGER.name())
                        .requestMatchers(GET, MANAGER_NOTIFICATIONS_PATH).hasAuthority(Role.MANAGER.name())
                        .requestMatchers(PUT, MANAGER_NOTIFICATION_READ_PATH).hasAuthority(Role.MANAGER.name())
                        .requestMatchers(MANAGER_PATH).hasAuthority(Role.MANAGER.name())

                        .anyRequest().authenticated() // Changed from denyAll() to authenticated() - more common, adjust if denyAll is strictly needed
                ) // for h2-console
                .sessionManagement((secuManagement) -> {
                    secuManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                })
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(configurer -> configurer.authenticationEntryPoint(authenticationEntryPoint));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Specify allowed origins (VERY IMPORTANT!)
        //    Must match your React app's URL exactly (e.g., http://localhost:3000)
        //    Do NOT use "*" if you need credentials (like sending Authorization headers)
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Adjust if your frontend runs elsewhere

        // 2. Specify allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name() // Crucial for preflight requests
        ));

        // 3. Specify allowed headers
        //    Include standard headers and importantly "Authorization" for JWT,
        //    and "Content-Type". Add any other custom headers your frontend sends.
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Cache-Control",
                "Content-Type",
                "Accept",
                "X-Requested-With"
                // Add any other headers needed by your frontend
        ));

        // 4. Allow credentials (cookies, Authorization headers)
        //    Required if your frontend sends credentials.
        configuration.setAllowCredentials(true);

        // 5. (Optional) Specify exposed headers
        //    If your frontend needs to read headers from the response (e.g., a custom header)
        // configuration.setExposedHeaders(List.of("Custom-Header"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this configuration to all paths /**
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userRepository);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception{
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}