import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Outlet, Route, Routes} from "react-router-dom";
import StudentInternships from "../Internships.jsx";
import {getStudentInternships, getStudentCvs, markInternshipAsViewed} from "../../../api/Api.jsx";
import i18n from "../../../../i18next.jsx";

vi.mock("../../../api/Api.jsx", () => ({
    getStudentInternships: vi.fn(),
    getStudentCvs: vi.fn(),
    markInternshipAsViewed: vi.fn(),
}));

vi.mock("../ApplyControls.jsx", () => ({
    default: () => null,
}));

const internship1 = {
    id: 1,
    title: "Développeur Java",
    description: "Développement backend avec Spring Boot",
    requiredSkills: "Java, Spring",
    location: "Montréal",
    workMode: "HYBRID",
    durationInWeeks: 16,
    compensationAmount: 25,
    compensationNegotiable: false,
    status: "APPROVED",
    employerEmail: "employer@example.com",
    uploadedAt: "2026-10-10T10:00:00",
    startDate: "2027-01-10",
    applicationDeadline: "2026-12-01",
    viewed: false
};

const internship2 = {
    ...internship1,
    id: 2,
    title: "Développeur React",
    description: "Développement frontend React",
    requiredSkills: "React, JavaScript",
    location: "Laval",
    uploadedAt: "2026-10-15T10:00:00",
};

const renderStudentInternships = () => render(
    <MemoryRouter>
        <Routes>
            <Route element={<Outlet context={{dark: false}}/>}>
                <Route path="/" element={<StudentInternships/>}/>
            </Route>
        </Routes>
    </MemoryRouter>
);

beforeEach(() => {
    vi.resetAllMocks();
    getStudentInternships.mockResolvedValue([internship1, internship2]);
    getStudentCvs.mockResolvedValue([]);
    markInternshipAsViewed.mockResolvedValue(undefined);
});

describe("StudentInternships displays available internship offers", () => {

    it("shouldDisplayApprovedInternships", async () => {
        // Arrange
        renderStudentInternships();

        // Assert
        expect(await screen.findByText("Développeur Java")).toBeInTheDocument();
        expect(screen.getByText("Développeur React")).toBeInTheDocument();
        expect(getStudentInternships).toHaveBeenCalledTimes(1);
    });

    it("shouldHidePendingAndRejectedInternships", async () => {
        // Arrange
        getStudentInternships.mockResolvedValue([
            internship1,
            {...internship2, id: 3, title: "Stage en attente", status: "PENDING"},
            {...internship2, id: 4, title: "Stage refusé", status: "REJECTED"},
        ]);

        // Act
        renderStudentInternships();
        await screen.findByText("Développeur Java");

        // Assert
        expect(screen.queryByText("Stage en attente")).not.toBeInTheDocument();
        expect(screen.queryByText("Stage refusé")).not.toBeInTheDocument();
    });

    it("shouldSortInternshipsNewestFirstByDefault", async () => {
        // Arrange
        renderStudentInternships();

        // Act
        await screen.findByText("Développeur React");

        // Assert
        const titles = screen.getAllByRole("heading", {level: 3});
        expect(titles[0]).toHaveTextContent("Développeur React");
        expect(titles[1]).toHaveTextContent("Développeur Java");
    });

    it("shouldShowEmptyMessageWhenNoInternshipsExist", async () => {
        // Arrange
        getStudentInternships.mockResolvedValue([]);

        // Act
        renderStudentInternships();

        // Assert
        expect(await screen.findByText(
            "No internships are currently available."
        )).toBeInTheDocument();
    });

    it("shouldShowErrorWhenInternshipsFailToLoad", async () => {
        // Arrange
        getStudentInternships.mockRejectedValue(new Error("Network error"));

        // Act
        renderStudentInternships();

        // Assert
        expect(await screen.findByText(
            "Failed to load internships."
        )).toBeInTheDocument();
    });
});

describe("StudentInternships allows students to consult offers", () => {

    it("shouldShowDetailsOnlyAfterClickingPreview", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur Java");

        // Assert
        expect(screen.queryByText(
            /Développement backend avec Spring Boot/
        )).not.toBeInTheDocument();

        // Act
        fireEvent.click(screen.getAllByRole("button", {name: i18n.t("studentInternship.preview")})[1]);

        // Assert
        expect(screen.getByText(
            /Développement backend avec Spring Boot/
        )).toBeInTheDocument();
    });

    it("shouldMarkInternshipAsViewedWhenOpeningDetails", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Act
        fireEvent.click(screen.getAllByRole("button", {name: i18n.t("studentInternship.preview")})[0]);

        // Assert
        await waitFor(() => {
            expect(markInternshipAsViewed).toHaveBeenCalledWith(2);
        });
    });

    it("shouldNotMarkInternshipAgainWhenHidingDetails", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Act
        fireEvent.click(screen.getAllByRole("button", {name: i18n.t("studentInternship.preview")})[0]);

        await waitFor(() => {
            expect(markInternshipAsViewed).toHaveBeenCalledTimes(1);
        });

        fireEvent.click(screen.getByRole("button", {name: i18n.t("studentInternship.hide")}));

        // Assert
        expect(markInternshipAsViewed).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(
            /Développement frontend React/
        )).not.toBeInTheDocument();
    });
});

describe("StudentInternships supports searching and sorting", () => {

    it("shouldSearchInternshipsByLocation", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Act
        fireEvent.change(screen.getByRole("searchbox"), {
            target: {value: "Montréal"}
        });

        // Assert
        expect(screen.getByText("Développeur Java")).toBeInTheDocument();
        expect(screen.queryByText("Développeur React")).not.toBeInTheDocument();
    });

    it("shouldSearchInternshipsByRequiredSkills", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Act
        fireEvent.change(screen.getByRole("searchbox"), {
            target: {value: "Spring"}
        });

        // Assert
        expect(screen.getByText("Développeur Java")).toBeInTheDocument();
        expect(screen.queryByText("Développeur React")).not.toBeInTheDocument();
    });

    it("shouldShowNoMatchesWhenSearchHasNoResults", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Act
        fireEvent.change(screen.getByRole("searchbox"), {
            target: {value: "Python Django"}
        });

        // Assert
        expect(screen.getByText(i18n.t("internshipFilters.noMatch"))).toBeInTheDocument();
        expect(screen.queryByText("Développeur Java")).not.toBeInTheDocument();
        expect(screen.queryByText("Développeur React")).not.toBeInTheDocument();
    });

    it("shouldSortInternshipsByOldestFirst", async () => {
        // Arrange
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Act
        fireEvent.change(screen.getByRole("combobox"), {
            target: {value: "OLDEST"}
        });

        // Assert
        const titles = screen.getAllByRole("heading", {level: 3});
        expect(titles[0]).toHaveTextContent("Développeur Java");
        expect(titles[1]).toHaveTextContent("Développeur React");
    });
});