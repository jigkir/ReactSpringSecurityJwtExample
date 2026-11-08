import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Outlet, Route, Routes} from "react-router-dom";
import StudentInternships from "../Internships.jsx";
import {
    getStudentInternships,
    getStudentCvs,
    getStudentAppliedInternships,
    markInternshipsAsViewed
} from "../../../api/Api.jsx";
import i18n from "../../../../i18next.jsx";
import {useNotifications} from "../../../notification/NotificationsProvider.jsx";
import {useSession} from "../../../../utils/useSession.js";

vi.mock("../../../api/Api.jsx", () => ({
    getStudentInternships: vi.fn(),
    getStudentCvs: vi.fn(),
    getStudentAppliedInternships: vi.fn(),
    markInternshipsAsViewed: vi.fn(),
}));

vi.mock("../../../notification/NotificationsProvider.jsx", () => ({
    useNotifications: vi.fn(),
}));

vi.mock("../../../../utils/useSession.js", () => ({
    useSession: vi.fn(),
}));

vi.mock("../ApplyControls.jsx", () => ({
    default: ({internshipId, onChanged}) => <button onClick={onChanged}>{`apply-${internshipId}`}</button>,
}));

const refreshNotifications = vi.fn();

const CURRENT_SESSION = {id: 1, name: "H2027", target: true};
const PAST_SESSION = {id: 2, name: "H2026", target: false};

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

const studentInternshipsPage = () => (
    <MemoryRouter>
        <Routes>
            <Route element={<Outlet context={{dark: false}}/>}>
                <Route path="/" element={<StudentInternships/>}/>
            </Route>
        </Routes>
    </MemoryRouter>
);

const renderStudentInternships = () => render(studentInternshipsPage());

beforeEach(() => {
    vi.resetAllMocks();
    getStudentInternships.mockResolvedValue([internship1, internship2]);
    getStudentCvs.mockResolvedValue([]);
    getStudentAppliedInternships.mockResolvedValue([]);
    markInternshipsAsViewed.mockResolvedValue(undefined);
    useNotifications.mockReturnValue({refresh: refreshNotifications});
    useSession.mockReturnValue({selectedSession: CURRENT_SESSION});
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

    it("shouldShowLoadingMessageWhileInternshipsLoad", () => {
        // Arrange
        getStudentInternships.mockReturnValue(new Promise(() => {
        }));

        // Act
        renderStudentInternships();

        // Assert
        expect(screen.getByText(i18n.t("studentInternship.loading"))).toBeInTheDocument();
    });

    it("shouldShowEmptyMessageWhenNoInternshipsExist", async () => {
        // Arrange
        getStudentInternships.mockResolvedValue([]);

        // Act
        renderStudentInternships();

        // Assert
        expect(await screen.findByText(i18n.t("studentInternship.empty"))).toBeInTheDocument();
    });

    it("shouldShowErrorWhenInternshipsFailToLoad", async () => {
        // Arrange
        getStudentInternships.mockRejectedValue(new Error("Network error"));

        // Act
        renderStudentInternships();

        // Assert
        expect(await screen.findByText(i18n.t("studentInternship.loadError"))).toBeInTheDocument();
    });
});

describe("StudentInternships shows offers expanded", () => {

    it("shouldShowDescriptionsWithoutAPreviewButton", async () => {
        // Arrange + Act
        renderStudentInternships();

        // Assert
        expect(await screen.findByText(/Développement backend avec Spring Boot/)).toBeInTheDocument();
        expect(screen.getByText(/Développement frontend React/)).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: i18n.t("studentInternship.preview")})).not.toBeInTheDocument();
    });
});

describe("StudentInternships orders NEW, then APPLIED, then OLD", () => {

    it("shouldListNewOffersBeforeAppliedOffers", async () => {
        // Arrange: Java (id 1) already applied to, React (id 2) is new and not applied to
        getStudentAppliedInternships.mockResolvedValue([{id: 50, internshipId: 1, cv: {id: 1}}]);

        // Act
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Assert
        await waitFor(() => {
            const titles = screen.getAllByRole("heading", {level: 3});
            expect(titles[0]).toHaveTextContent("Développeur React");
            expect(titles[1]).toHaveTextContent("Développeur Java");
        });
    });

    it("shouldListAppliedOffersBeforeOldOffers", async () => {
        // Arrange: both viewed. Java (id 1) is OLD, React (id 2) is APPLIED
        getStudentInternships.mockResolvedValue([
            {...internship1, viewed: true},
            {...internship2, viewed: true},
        ]);
        getStudentAppliedInternships.mockResolvedValue([{id: 50, internshipId: 2, cv: {id: 1}}]);

        // Act
        renderStudentInternships();
        await screen.findByText("Développeur React");

        // Assert
        await waitFor(() => {
            const titles = screen.getAllByRole("heading", {level: 3});
            expect(titles[0]).toHaveTextContent("Développeur React");
            expect(titles[1]).toHaveTextContent("Développeur Java");
        });
    });

    it("shouldPutNewThenAppliedThenOld", async () => {
        // Arrange
        getStudentInternships.mockResolvedValue([
            {...internship1, id: 1, title: "Old offer", viewed: true},
            {...internship1, id: 2, title: "Applied offer", viewed: true},
            {...internship1, id: 3, title: "New offer", viewed: false},
        ]);
        getStudentAppliedInternships.mockResolvedValue([{id: 50, internshipId: 2, cv: {id: 1}}]);

        // Act
        renderStudentInternships();
        await screen.findByText("New offer");

        // Assert
        await waitFor(() => {
            const titles = screen.getAllByRole("heading", {level: 3}).map((h) => h.textContent);
            expect(titles).toEqual(["New offer", "Applied offer", "Old offer"]);
        });
    });
});

describe("StudentInternships shows the application badge and status", () => {

    it("shouldShowAppliedBadgeWhenStudentHasApplied", async () => {
        // Arrange
        getStudentAppliedInternships.mockResolvedValue([
            {id: 50, internshipId: 1, cv: {id: 1}, internshipApplicationStatus: "UNREAD"},
        ]);

        // Act
        renderStudentInternships();

        // Assert
        expect(await screen.findByText(i18n.t("studentInternship.appliedBadge"))).toBeInTheDocument();
        expect(screen.getAllByText(i18n.t("studentInternship.appliedBadge"))).toHaveLength(1);
    });

    it("shouldShowNoAppliedBadgeWhenNothingWasApplied", async () => {
        // Arrange + Act
        renderStudentInternships();
        await screen.findByText("Développeur Java");

        // Assert
        expect(screen.queryByText(i18n.t("studentInternship.appliedBadge"))).not.toBeInTheDocument();
    });
});

describe("StudentInternships viewed state", () => {

    it("shouldKeepNewBadgeWhileOnThePageAndNotMarkViewedYet", async () => {
        // Arrange + Act
        renderStudentInternships();
        await screen.findByText("Développeur Java");

        // Assert
        expect(screen.getAllByText(i18n.t("studentInternship.new"))).toHaveLength(2);
        expect(markInternshipsAsViewed).not.toHaveBeenCalled();
    });

    it("shouldMarkOffersAsViewedWhenLeavingThePage", async () => {
        // Arrange
        const {unmount} = renderStudentInternships();
        await screen.findByText("Développeur Java");

        // Act
        unmount();

        // Assert
        expect(markInternshipsAsViewed).toHaveBeenCalledWith(expect.arrayContaining([1, 2]));
    });

    it("shouldNotCallTheApiWhenLeavingAPageWithNoNewOffers", async () => {
        // Arrange
        getStudentInternships.mockResolvedValue([
            {...internship1, viewed: true},
            {...internship2, viewed: true},
        ]);
        const {unmount} = renderStudentInternships();
        await screen.findByText("Développeur Java");

        // Act
        unmount();

        // Assert
        expect(markInternshipsAsViewed).not.toHaveBeenCalled();
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
        fireEvent.change(screen.getByLabelText(i18n.t("internshipFilters.sortAria")), {
            target: {value: "OLDEST"}
        });

        // Assert
        const titles = screen.getAllByRole("heading", {level: 3});
        expect(titles[0]).toHaveTextContent("Développeur Java");
        expect(titles[1]).toHaveTextContent("Développeur React");
    });
});

describe("StudentInternships refreshes notifications", () => {

    it("shouldRefreshNotificationsAfterApplying", async () => {
        // Arrange
        renderStudentInternships();

        // Act
        fireEvent.click(await screen.findByRole("button", {name: "apply-1"}));

        // Assert
        await waitFor(() => expect(refreshNotifications).toHaveBeenCalledTimes(1));
        expect(getStudentAppliedInternships).toHaveBeenCalledTimes(2);
    });
});

describe("StudentInternships follows the chosen session", () => {
    it("shouldNotLoadOffersWhileSessionsAreLoading", async () => {
        // Arrange
        useSession.mockReturnValue({selectedSession: null});

        // Act
        renderStudentInternships();

        // Assert
        await waitFor(() => expect(getStudentCvs).toHaveBeenCalled());
        expect(getStudentInternships).not.toHaveBeenCalled();
        expect(getStudentAppliedInternships).not.toHaveBeenCalled();
    });

    it("shouldLoadOffersAndApplicationsOfChosenSession", async () => {
        // Arrange
        useSession.mockReturnValue({selectedSession: PAST_SESSION});

        // Act
        renderStudentInternships();

        // Assert
        await waitFor(() => expect(getStudentInternships).toHaveBeenCalledWith(PAST_SESSION.id));
        expect(getStudentAppliedInternships).toHaveBeenCalledWith(PAST_SESSION.id);
    });

    it("shouldReloadOffersWhenStudentChoosesAnotherSession", async () => {
        // Arrange
        const {rerender} = renderStudentInternships();
        await waitFor(() => expect(getStudentInternships).toHaveBeenCalledWith(CURRENT_SESSION.id));

        // Act
        useSession.mockReturnValue({selectedSession: PAST_SESSION});
        rerender(studentInternshipsPage());

        // Assert
        await waitFor(() => expect(getStudentInternships).toHaveBeenCalledWith(PAST_SESSION.id));
        expect(getStudentAppliedInternships).toHaveBeenCalledWith(PAST_SESSION.id);
    });
});