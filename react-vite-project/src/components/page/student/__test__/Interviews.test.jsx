import {act, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Outlet, Route, Routes} from "react-router-dom";
import StudentInterviews from "../Interviews.jsx";
import {getStudentInterviews} from "../../../api/Api.jsx";
import {usePolling} from "../../../../utils/usePolling.js";
import i18n from "../../../../i18next.jsx";

vi.mock("../../../api/Api.jsx", () => ({
    getStudentInterviews: vi.fn(),
}));

vi.mock("../../../../utils/usePolling.js", () => ({
    usePolling: vi.fn(),
}));

function dateInDays(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

const interview1 = {
    id: 1,
    applicationId: 101,
    employerName: "Entreprise ABC",
    internshipTitle: "Développeur Java",
    message: "Bonjour, nous souhaitons vous rencontrer.",
    studentDecision: "PENDING",
    interviewDate: dateInDays(3),
    meetingType: "ONLINE",
    meetingDetails: "https://meet.example.com/",
    interviewStatus: "SCHEDULED",
};

const interview2 = {
    ...interview1,
    id: 2,
    applicationId: 102,
    employerName: "Entreprise XYZ",
    internshipTitle: "Développeur React",
    message: "Bienvenue.",
    interviewDate: dateInDays(7),
    meetingType: "IN_PERSON",
    meetingDetails: "123 rue Lapierre, Montréal",
};

const renderStudentInterviews = (dark = false) => render(
    <MemoryRouter>
        <Routes>
            <Route element={<Outlet context={{dark}}/>}>
                <Route path="/" element={<StudentInterviews/>}/>
            </Route>
        </Routes>
    </MemoryRouter>
);

const cardOf = (title) => screen.getByText(title).closest("article");

beforeEach(async () => {
    vi.resetAllMocks();
    await i18n.changeLanguage("en");
    getStudentInterviews.mockResolvedValue([interview1, interview2]);
});

describe("StudentInterviews displays interview invitations", () => {
    it("shouldDisplayInterviewInformationFromTheBackendDTO", async () => {
        // Arrange + Act
        renderStudentInterviews();

        // Assert
        expect(await screen.findByText("Développeur Java")).toBeInTheDocument();
        expect(screen.getByText("Développeur React")).toBeInTheDocument();
        expect(screen.getByText("Entreprise ABC")).toBeInTheDocument();
        expect(screen.getByText("Entreprise XYZ")).toBeInTheDocument();
        expect(screen.getByText(interview1.message)).toBeInTheDocument();
        expect(screen.getByText(interview2.meetingDetails)).toBeInTheDocument();
        expect(within(cardOf("Développeur Java")).getByText(i18n.t("studentInterviews.types.ONLINE"))).toBeInTheDocument();
        expect(within(cardOf("Développeur React")).getByText(i18n.t("studentInterviews.types.IN_PERSON"))).toBeInTheDocument();
        expect(getStudentInterviews).toHaveBeenCalledTimes(1);
    });

    it("shouldShowLoadingWhileTheRequestIsPending", async () => {
        // Arrange
        let resolveRequest;
        getStudentInterviews.mockReturnValue(new Promise((resolve) => {
            resolveRequest = resolve;
        }));

        // Act
        renderStudentInterviews();

        // Assert
        expect(screen.getByText(i18n.t("studentInterviews.loading"))).toBeInTheDocument();

        // Finish the pending request to avoid leaving an unresolved update.
        await act(async () => resolveRequest([]));
    });

    it("shouldShowEmptyMessageWhenThereAreNoInterviews", async () => {
        // Arrange
        getStudentInterviews.mockResolvedValue([]);

        // Act
        renderStudentInterviews();

        // Assert
        expect(await screen.findByText(i18n.t("studentInterviews.empty"))).toBeInTheDocument();
    });

    it("shouldShowErrorWhenInterviewsFailToLoad", async () => {
        // Arrange
        getStudentInterviews.mockRejectedValue(new Error("Network error"));

        // Act
        renderStudentInterviews();

        // Assert
        expect(await screen.findByRole("alert")).toHaveTextContent(
            i18n.t("studentInterviews.loadError")
        );
        expect(screen.queryByText("Développeur Java")).not.toBeInTheDocument();
    });

    it("shouldRejectAnUnexpectedApiResponse", async () => {
        // Arrange
        getStudentInterviews.mockResolvedValue({interviews: []});

        // Act
        renderStudentInterviews();

        // Assert
        expect(await screen.findByRole("alert")).toHaveTextContent(
            i18n.t("studentInterviews.loadError")
        );
    });
});

describe("StudentInterviews sorts interviews", () => {
    it("shouldShowUpcomingThenPastThenCancelledWithCorrectDateOrder", async () => {
        // Arrange: API deliberately returns interviews in the wrong order.
        getStudentInterviews.mockResolvedValue([
            {...interview1, id: 11, internshipTitle: "Past older", interviewDate: dateInDays(-10)},
            {
                ...interview1,
                id: 12,
                internshipTitle: "Cancelled",
                interviewDate: dateInDays(20),
                interviewStatus: "CANCELLED"
            },
            {...interview1, id: 13, internshipTitle: "Upcoming later", interviewDate: dateInDays(10)},
            {...interview1, id: 14, internshipTitle: "Past recent", interviewDate: dateInDays(-2)},
            {...interview1, id: 15, internshipTitle: "Upcoming sooner", interviewDate: dateInDays(2)},
        ]);

        // Act
        renderStudentInterviews();
        await screen.findByText("Upcoming sooner");

        // Assert: future ascending; past descending; cancelled always last.
        const titles = screen.getAllByRole("heading", {level: 2}).map((element) => element.textContent);
        expect(titles).toEqual([
            "Upcoming sooner",
            "Upcoming later",
            "Past recent",
            "Past older",
            "Cancelled",
        ]);
    });

    it("shouldShowUpcomingPastAndCancelledLabels", async () => {
        // Arrange
        getStudentInterviews.mockResolvedValue([
            {...interview1, id: 21, internshipTitle: "Future interview", interviewDate: dateInDays(2)},
            {...interview1, id: 22, internshipTitle: "Past interview", interviewDate: dateInDays(-2)},
            {
                ...interview1,
                id: 23,
                internshipTitle: "Cancelled interview",
                interviewDate: dateInDays(4),
                interviewStatus: "CANCELLED"
            },
        ]);

        // Act
        renderStudentInterviews();
        await screen.findByText("Future interview");

        // Assert: checked inside each card, because the status filter <option>s use the same labels
        expect(within(cardOf("Future interview")).getByText(i18n.t("studentInterviews.statuses.upcoming"))).toBeInTheDocument();
        expect(within(cardOf("Past interview")).getByText(i18n.t("studentInterviews.statuses.past"))).toBeInTheDocument();
        expect(within(cardOf("Cancelled interview")).getByText(i18n.t("studentInterviews.statuses.cancelled"))).toBeInTheDocument();
    });

    it("shouldPutCancelledInterviewsLastEvenWhenTheirDatesAreInTheFuture", async () => {
        // Arrange
        getStudentInterviews.mockResolvedValue([
            {
                ...interview1,
                id: 31,
                internshipTitle: "Cancelled later",
                interviewDate: dateInDays(30),
                interviewStatus: "CANCELLED"
            },
            {
                ...interview1,
                id: 32,
                internshipTitle: "Cancelled sooner",
                interviewDate: dateInDays(5),
                interviewStatus: "CANCELLED"
            },
            {...interview1, id: 33, internshipTitle: "Scheduled", interviewDate: dateInDays(2)},
        ]);

        // Act
        renderStudentInterviews();
        await screen.findByText("Scheduled");

        // Assert: the current component sorts cancelled dates most recent first.
        const titles = screen.getAllByRole("heading", {level: 2}).map((element) => element.textContent);
        expect(titles).toEqual(["Scheduled", "Cancelled later", "Cancelled sooner"]);
    });
});

it("shouldNotTurnAnInPersonAddressIntoALink", async () => {
    // Arrange
    getStudentInterviews.mockResolvedValue([
        {...interview2, meetingDetails: "https://example.com/address"},
    ]);

    // Act
    renderStudentInterviews();
    await screen.findByText("Développeur React");

    // Assert
    expect(screen.getByText("https://example.com/address")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("shouldShowPhoneMeetingType", async () => {
    // Arrange
    getStudentInterviews.mockResolvedValue([
        {...interview1, meetingType: "PHONE", meetingDetails: "514-555-1234"},
    ]);

    // Act
    renderStudentInterviews();
    await screen.findByText("Développeur Java");

    // Assert
    expect(within(cardOf("Développeur Java")).getByText(i18n.t("studentInterviews.types.PHONE"))).toBeInTheDocument();
    expect(screen.getByText("514-555-1234")).toBeInTheDocument();
});

it("shouldShowFallbackWhenMeetingDetailsAndMessageAreMissing", async () => {
    // Arrange
    getStudentInterviews.mockResolvedValue([
        {...interview1, meetingDetails: "", message: ""},
    ]);

    // Act
    renderStudentInterviews();
    await screen.findByText("Développeur Java");

    // Assert
    expect(screen.getAllByText(i18n.t("studentInterviews.notProvided"))).toHaveLength(2);
});

describe("StudentInterviews supports themes and automatic refresh", () => {
    it("shouldUseLightModeClasses", async () => {
        // Arrange + Act
        renderStudentInterviews(false);
        const title = await screen.findByText("Développeur Java");

        // Assert
        expect(title.closest("article")).toHaveClass("bg-white");
    });

    it("shouldUseDarkModeClasses", async () => {
        // Arrange + Act
        renderStudentInterviews(true);
        const title = await screen.findByText("Développeur Java");

        // Assert
        expect(title.closest("article")).toHaveClass("bg-slate-800");
    });

    it("shouldRegisterPollingAndShowUpdatedEmployerInformation", async () => {
        // Arrange
        getStudentInterviews.mockResolvedValue([interview1]);
        renderStudentInterviews();
        await screen.findByText("Développeur Java");
        expect(usePolling).toHaveBeenCalled();

        // Act: simulate the polling hook calling its callback.
        getStudentInterviews.mockResolvedValue([
            {...interview1, interviewDate: dateInDays(8), message: "L'heure a changé."},
        ]);
        const refresh = usePolling.mock.calls.at(-1)[0];
        await act(async () => {
            await refresh();
        });

        // Assert
        await waitFor(() => expect(screen.getByText("L'heure a changé.")).toBeInTheDocument());
        expect(screen.queryByText(interview1.message)).not.toBeInTheDocument();
        expect(getStudentInterviews).toHaveBeenCalledTimes(2);
    });

    it("shouldRecoverFromAnInitialErrorAfterARefresh", async () => {
        // Arrange
        getStudentInterviews.mockRejectedValueOnce(new Error("Server unavailable"));
        renderStudentInterviews();
        await screen.findByRole("alert");

        // Act
        getStudentInterviews.mockResolvedValue([interview1]);
        const refresh = usePolling.mock.calls.at(-1)[0];
        await act(async () => {
            await refresh();
        });

        // Assert
        expect(await screen.findByText("Développeur Java")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});

describe("StudentInterviews translations", () => {
    it("shouldProvideKeyLabelsInFrenchAndEnglish", () => {
        // Assert that translations exist, rather than accepting the raw keys as text.
        for (const lng of ["fr", "en"]) {
            for (const key of [
                "studentInterviews.title",
                "studentInterviews.empty",
                "studentInterviews.date",
                "studentInterviews.statuses.upcoming",
                "studentInterviews.statuses.past",
                "studentInterviews.statuses.cancelled",
                "studentInterviews.types.ONLINE",
                "studentInterviews.types.IN_PERSON",
                "studentInterviews.types.PHONE",
            ]) {
                expect(i18n.exists(key, {lng})).toBe(true);
            }
        }
    });
});