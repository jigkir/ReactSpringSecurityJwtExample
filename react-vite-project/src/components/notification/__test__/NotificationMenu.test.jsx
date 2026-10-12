import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {BrowserRouter} from "react-router-dom";
import NotificationMenu from "../NotificationMenu.jsx";
import {NotificationsProvider} from "../NotificationsProvider.jsx";
import {getNotifications, markNotificationsAsRead} from "../../api/Api.jsx";

vi.mock("../../api/Api.jsx", () => ({
    getNotifications: vi.fn(),
    getUnreadNotificationCount: vi.fn(),
    markNotificationsAsRead: vi.fn(),
}));

const EMPLOYER = {id: 1, role: "EMPLOYER"};

const MockNotificationMenu = () => (
    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <NotificationsProvider user={EMPLOYER}>
            <NotificationMenu dark={false}/>
        </NotificationsProvider>
    </BrowserRouter>
);

const openMenu = () => fireEvent.click(screen.getByRole("button"));

beforeEach(() => {
    vi.resetAllMocks();
    localStorage.setItem("token", "token");
});

describe("NotificationMenu shows employer internship offer review decisions", () => {

    it("shouldShowReviewDecisionsWhenEmployerOpensMenu", async () => {
        // Arrange
        getNotifications.mockResolvedValue([
            {notificationType: "INTERNSHIP_OFFER_APPROVED"},
            {notificationType: "INTERNSHIP_OFFER_REJECTED"},
            {notificationType: "INTERNSHIP_OFFER_REJECTED"},
        ]);
        render(<MockNotificationMenu/>);
        await screen.findByText("3");

        // Act
        openMenu();

        // Assert
        expect(screen.getByRole("link", {name: "1 offre(s) de stage approuvée(s)"})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "2 offre(s) de stage refusée(s)"})).toBeInTheDocument();
    });

    it("shouldShowNoNotificationsWhenEmployerHasNoReviewDecision", async () => {
        // Arrange
        getNotifications.mockResolvedValue([]);
        render(<MockNotificationMenu/>);
        await waitFor(() => expect(getNotifications).toHaveBeenCalled());

        // Act
        openMenu();

        // Assert
        expect(screen.getByText("Vous n'avez pas de nouvelles notifications")).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("shouldMarkReviewsAsReadWhenEmployerOpensInternshipsPage", async () => {
        // Arrange
        getNotifications
            .mockResolvedValueOnce([{notificationType: "INTERNSHIP_OFFER_APPROVED"}])
            .mockResolvedValue([]);
        markNotificationsAsRead.mockResolvedValue();
        render(<MockNotificationMenu/>);
        await screen.findByText("1");
        openMenu();

        // Act
        fireEvent.click(screen.getByRole("link", {name: "1 offre(s) de stage approuvée(s)"}));

        // Assert
        await waitFor(() => expect(screen.queryByText("1")).not.toBeInTheDocument());
        expect(markNotificationsAsRead).toHaveBeenCalledWith("INTERNSHIP_OFFER");
    });
});

describe("NotificationMenu handles employer notification errors", () => {

    it("shouldShowErrorWhenNotificationsFailToLoad", async () => {
        // Arrange
        getNotifications.mockRejectedValue(new Error("network error"));
        render(<MockNotificationMenu/>);
        await waitFor(() => expect(getNotifications).toHaveBeenCalled());

        // Act
        openMenu();

        // Assert
        expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de charger les notifications.");
    });
});