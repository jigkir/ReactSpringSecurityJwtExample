import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {BrowserRouter} from "react-router-dom";
import NotificationMenu from "../NotificationMenu.jsx";
import {NotificationsProvider} from "../NotificationsProvider.jsx";
import {getNotifications, markNotificationsAsRead} from "../../api/Api.jsx";
import i18n from "../../../i18next.jsx";

vi.mock("../../api/Api.jsx", () => ({
    getNotifications: vi.fn(),
    markNotificationsAsRead: vi.fn(),
}));

const EMPLOYER = {id: 1, role: "EMPLOYER"};

// Labels come from the translations, so rewording them never breaks these tests
const approvedLabel = (amount) => i18n.t("navbar.internshipApprovedNotification", {amount});
const rejectedLabel = (amount) => i18n.t("navbar.internshipRejectedNotification", {amount});

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
        expect(screen.getByRole("link", {name: approvedLabel(1)})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: rejectedLabel(2)})).toBeInTheDocument();
    });

    it("shouldShowNoNotificationsWhenEmployerHasNoReviewDecision", async () => {
        // Arrange
        getNotifications.mockResolvedValue([]);
        render(<MockNotificationMenu/>);
        await waitFor(() => expect(getNotifications).toHaveBeenCalled());

        // Act
        openMenu();

        // Assert
        expect(screen.getByText(i18n.t("navbar.noNotifications"))).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("shouldKeepReviewDecisionUnreadWhenEmployerOpensInternshipsPage", async () => {
        // Arrange
        getNotifications.mockResolvedValue([
            {id: 4, notificationType: "INTERNSHIP_OFFER_APPROVED", targetType: "INTERNSHIP_OFFER", targetId: 9},
        ]);
        render(<MockNotificationMenu/>);
        await screen.findByText("1");
        openMenu();

        // Act
        fireEvent.click(screen.getByRole("link", {name: approvedLabel(1)}));

        // Assert
        await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(2));
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(markNotificationsAsRead).not.toHaveBeenCalled();
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
        expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("navbar.notificationLoadError"));
    });
});