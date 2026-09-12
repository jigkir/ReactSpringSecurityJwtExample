package com.lacouf.rsbjwt.security;

import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
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
import org.springframework.web.filter.CorsFilter;

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

    private static final String H2_CONSOLE_PATH = "/h2-console/**";
    private static final String USER_LOGIN_PATH = "/user/login";
    private static final String EMPRUNTEUR_REGISTER_PATH = "/emprunteur/register";
    private static final String PREPOSE_REGISTER_PATH = "/prepose/register";
    private static final String STUDENT_SIGNUP_PATH = "/student/signup";
    private static final String EMPLOYER_REGISTER_PATH = "/employer/register";
    private static final String USER_PATH = "/user/**";
    private static final String EMPRUNTEUR_PATH = "/emprunteur/**";
    private static final String PREPOSE_PATH = "/prepose/**";
    private static final String GESTIONNAIRE_PATH = "/gestionnaire/**";



    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(POST, USER_LOGIN_PATH).permitAll()
                        .requestMatchers(POST, EMPRUNTEUR_REGISTER_PATH).permitAll()
                        .requestMatchers(POST, PREPOSE_REGISTER_PATH).permitAll()
                        .requestMatchers(POST, STUDENT_SIGNUP_PATH).permitAll()
                        .requestMatchers(POST, EMPLOYER_REGISTER_PATH).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll() // Allow CORS preflight requests
                        .requestMatchers(H2_CONSOLE_PATH).permitAll() // Allow H2 console access

                        // Use Role enum names for authorities
                        .requestMatchers(GET, USER_PATH).hasAnyAuthority(Role.EMPRUNTEUR.name(), Role.PREPOSE.name(), Role.GESTIONNAIRE.name())
                        .requestMatchers(EMPRUNTEUR_PATH).hasAuthority(Role.EMPRUNTEUR.name())
                        .requestMatchers(PREPOSE_PATH).hasAuthority(Role.PREPOSE.name())
                        .requestMatchers(GESTIONNAIRE_PATH).hasAuthority(Role.GESTIONNAIRE.name())
                        .anyRequest().authenticated() // Changed from denyAll() to authenticated() - more common, adjust if denyAll is strictly needed
                )
                .headers(headers -> headers.frameOptions(Customizer.withDefaults()).disable()) // for h2-console
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
                "X-Requested-With",
                "*"
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
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() throws Exception {
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