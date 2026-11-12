package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractLanguage;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ContractPdfGeneratorTest {

    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 11, 10, 14, 30);
    private static final LocalDateTime MANAGER_SIGNED_AT = LocalDateTime.of(2026, 11, 11, 9, 0);

    private final ContractPdfGenerator contractPdfGenerator = new ContractPdfGenerator(messageSource());

    @Test
    void shouldWritePartiesAndInternshipTermsWhenGeneratingContract() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), false, "Développer des applications web"));

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.FR));

        // Assert
        assert text.contains("CONTRAT DE STAGE");
        assert !text.contains("(ATE)");
        assert !text.contains("no 30");
        assert text.contains("Créé le 10 novembre 2026");
        assert text.contains("Tech Corp");
        assert text.contains("Représenté par Jean Dupont");
        assert text.contains("Marie Tremblay");
        assert text.contains("Matricule 2234567");
        assert text.contains("Développeur web");
        assert text.contains("Montréal");
        assert text.contains("Hybride");
        assert text.contains("Du 11 janvier 2027 au 2 mai 2027");
        assert text.contains("16 semaines");
        assert text.contains("25,00");
        assert text.contains("Non");
        assert text.contains("DESCRIPTION DE L'OFFRE");
        assert text.contains("Développer des applications web");
        assert text.contains("Java, React");
    }

    @Test
    void shouldNotWriteWorkScheduleWhenGeneratingContract() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), false, "Développer des applications web"));

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.FR));

        // Assert
        assert !text.contains("Horaire");
        assert !text.contains("heures par semaine");
    }

    @Test
    void shouldWriteCommitmentsOfEachPartyWhenGeneratingContract() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), false, "Développer des applications web"));

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.FR));

        // Assert
        assert text.contains("Le Collège s'engage à :");
        assert text.contains("L'employeur s'engage à :");
        assert text.contains("Le stagiaire s'engage à :");
        assert text.contains("assurer l'encadrement pédagogique du stagiaire");
    }

    @Test
    void shouldWriteNotSpecifiedWhenOfferHasNoHourlyRate() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(null, true, "Développer des applications web"));

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.FR));

        // Assert
        assert text.contains("Non précisé dans l'offre");
        assert text.contains("Oui");
    }

    @Test
    void shouldShowManagerSigningTimeAndPendingPartiesWhenOnlyManagerSigned() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), false, "Développer des applications web"));
        contract.signAsManager(manager(), MANAGER_SIGNED_AT);

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.FR));

        // Assert
        assert text.contains("John Doe");
        assert text.contains("Signé le 11 novembre 2026 à 09:00");
        assert text.split("En attente de signature", -1).length - 1 == 2;
    }

    @Test
    void shouldShowManagerToBeAssignedWhenManagerHasNotSigned() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), false, "Développer des applications web"));

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.FR));

        // Assert
        assert text.contains("À désigner");
        assert text.split("En attente de signature", -1).length - 1 == 3;
    }

    @Test
    void shouldWriteContractInEnglishWhenUserChoosesEnglish() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), true, "Develop web applications"));
        contract.signAsManager(manager(), MANAGER_SIGNED_AT);

        // Act
        String text = textOf(contractPdfGenerator.generate(contract, ContractLanguage.EN));

        // Assert
        assert text.contains("INTERNSHIP CONTRACT");
        assert text.contains("Represented by Jean Dupont");
        assert text.contains("Hybrid");
        assert text.contains("From January 11, 2027 to May 2, 2027");
        assert text.contains("$25.00 per hour");
        assert text.contains("OFFER DESCRIPTION");
        assert text.contains("Yes");
        assert text.contains("The employer agrees to:");
        assert text.contains("Signed on November 11, 2026 at 09:00");
        assert text.contains("Pending signature");
    }

    @Test
    void shouldAddNumberedPagesWhenDescriptionIsLong() throws IOException {
        // Arrange
        Contract contract = contractOf(internship(new BigDecimal("25.00"), false, "Tâche du stagiaire.\n".repeat(80)));

        // Act
        byte[] pdf = contractPdfGenerator.generate(contract, ContractLanguage.FR);

        // Assert
        try (PdfDocument document = pdfDocumentOf(pdf)) {
            int numberOfPages = document.getNumberOfPages();
            assert numberOfPages > 1;
            assert textOf(pdf).contains("Page " + numberOfPages + " de " + numberOfPages);
        }
    }

    // ---------- Helpers ----------

    private static Contract contractOf(Internship internship) {
        Student student = new Student("Marie", "Tremblay", "2234567", credentials("marie@example.com", Role.STUDENT), Discipline.COMPUTER_SCIENCE, null);

        InternshipApplication application = new InternshipApplication(internship, new CV(), student);
        application.updateEmployerDecision(EmployerDecision.INTERNSHIP_OFFERED);

        Contract contract = new Contract(application, CREATED_AT);
        contract.setId(30L);
        return contract;
    }

    private static Internship internship(BigDecimal hourlyRate, boolean negotiable, String description) {
        Employer employer = new Employer("Jean", "Dupont", credentials("jean@techcorp.com", Role.EMPLOYER), "Tech Corp", Discipline.COMPUTER_SCIENCE, "5141234567");
        AcademicSession session = new AcademicSession(Season.WINTER, 2027);

        return new Internship("Développeur web", description, "Java, React", 16, "Montréal", WorkMode.HYBRID,
                LocalDate.of(2027, 1, 11), LocalDate.of(2026, 12, 1), hourlyRate, negotiable, employer, session);
    }

    private static Manager manager() {
        return new Manager("John", "Doe", credentials("gestion.stages@claurendeau.qc.ca", Role.MANAGER), "450-555-0000");
    }

    private static Credentials credentials(String email, Role role) {
        return Credentials.builder().email(email).password("Test123@-encoded").role(role).build();
    }

    private static MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setAlwaysUseMessageFormat(true);

        return messageSource;
    }

    private static String textOf(byte[] pdf) throws IOException {
        StringBuilder text = new StringBuilder();

        try (PdfDocument document = pdfDocumentOf(pdf)) {
            for (int page = 1; page <= document.getNumberOfPages(); page++) {
                text.append(PdfTextExtractor.getTextFromPage(document.getPage(page))).append('\n');
            }
        }

        return text.toString();
    }

    private static PdfDocument pdfDocumentOf(byte[] pdf) throws IOException {
        return new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)));
    }
}