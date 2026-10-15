import React from 'react';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {BrowserRouter, MemoryRouter} from 'react-router-dom';
import {NotificationsProvider, useNotifications} from '../NotificationsProvider';
import * as api from '../../api/Api.jsx';

vi.mock('../../api/Api.jsx', () => ({
    getNotifications: vi.fn(),
    markNotificationsAsRead: vi.fn(),
    getUnreadNotificationCount: vi.fn(),
}));

function TestNotificationConsumer() {
    const {items, clearInternships} = useNotifications();
    const internshipItem = items.find(item => item.id === 'internshipPosted');

    return (
        <div>
            <span data-testid="internship-count">{internshipItem?.count}</span>
            <span data-testid="internship-label">{internshipItem?.labelKey}</span>
            <button onClick={clearInternships} data-testid="clear-btn">Clear Internships</button>
        </div>
    );
}

describe('NotificationsProvider - Manager Internship Review Notification', () => {

    beforeEach(() => {
        localStorage.setItem('token', 'fake-jwt-token');
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should correctly count and display internship submitted for review notifications for a manager', async () => {
        // Arrange
        const mockNotifications = [
            {id: 10, notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW'},
            {id: 11, notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW'},
            {id: 12, notificationType: 'CV_SUBMITTED_FOR_REVIEW'}
        ];
        api.getNotifications.mockResolvedValueOnce(mockNotifications);
        const managerUser = {id: 1, role: 'MANAGER'};

        // Act
        render(
            <BrowserRouter>
                <NotificationsProvider user={managerUser}>
                    <TestNotificationConsumer/>
                </NotificationsProvider>
            </BrowserRouter>
        );

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('internship-count').textContent).toBe('2');
        });

        expect(screen.getByTestId('internship-label').textContent).toBe(
            'navbar.internshipSubmittedForReviewNotification'
        );

        expect(api.getNotifications).toHaveBeenCalledTimes(1);
    });

    it('should clear internship notifications when clearInternships is called', async () => {
        // Arrange
        const mockNotifications = [
            {id: 10, notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW'}
        ];
        api.getNotifications.mockResolvedValueOnce(mockNotifications);
        api.markNotificationsAsRead.mockResolvedValueOnce({});
        const managerUser = {id: 1, role: 'MANAGER'};

        // Act
        render(
            <BrowserRouter>
                <NotificationsProvider user={managerUser}>
                    <TestNotificationConsumer/>
                </NotificationsProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('internship-count').textContent).toBe('1');
        });

        fireEvent.click(screen.getByTestId('clear-btn'));

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('internship-count').textContent).toBe('0');
        });

        expect(api.markNotificationsAsRead).toHaveBeenCalledWith('INTERNSHIP_OFFER');
    });

    it('should display a count of 1 when there is a single internship notification', async () => {
        // Arrange
        const mockNotifications = [
            {id: 10, notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW'}
        ];
        api.getNotifications.mockResolvedValueOnce(mockNotifications);
        const managerUser = {id: 1, role: 'MANAGER'};

        // Act
        render(
            <BrowserRouter>
                <NotificationsProvider user={managerUser}>
                    <TestNotificationConsumer/>
                </NotificationsProvider>
            </BrowserRouter>
        );

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('internship-count').textContent).toBe('1');
        });

        expect(screen.getByTestId('internship-label').textContent).toBe(
            'navbar.internshipSubmittedForReviewNotification'
        );
    });
});

const EMPLOYER = {id: 2, role: 'EMPLOYER'};
const INTERNSHIPS_PAGE_PATH = '/internships';
const NEW_INTERNSHIP_APPLICATION = 'NEW_INTERNSHIP_APPLICATION';

function NewInternshipApplicationNotificationDisplay() {
    const {items, errorKey} = useNotifications();
    const newApplicationItem = items.find(item => item.id === 'newInternshipApplication');

    return (
        <div>
            <span data-testid="new-application-count">{newApplicationItem?.count}</span>
            <span data-testid="new-application-label">{newApplicationItem?.labelKey}</span>
            <span data-testid="notification-error">{errorKey}</span>
        </div>
    );
}

const renderEmployerNotificationsAt = (path = '/') => render(
    <MemoryRouter initialEntries={[path]}>
        <NotificationsProvider user={EMPLOYER}>
            <NewInternshipApplicationNotificationDisplay/>
        </NotificationsProvider>
    </MemoryRouter>
)

describe('NotificationsProvider - Employer New Internship Application Notification', () => {

    beforeEach(() => {
        localStorage.setItem('token', 'fake-jwt-token');
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should count only new internship application notifications when employer has unread notifications', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {id: 20, notificationType: NEW_INTERNSHIP_APPLICATION},
            {id: 21, notificationType: NEW_INTERNSHIP_APPLICATION},
            {id: 22, notificationType: 'INTERNSHIP_OFFER_APPROVED'}
        ]);

        // Act
        renderEmployerNotificationsAt();

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('new-application-count').textContent).toBe('2');
        });

        expect(screen.getByTestId('new-application-label').textContent).toBe('navbar.newInternshipApplicationNotification');
    });

    it('should keep new internship application notifications unread when employer opens internships page', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {id: 20, notificationType: NEW_INTERNSHIP_APPLICATION}
        ]);

        // Act
        renderEmployerNotificationsAt(INTERNSHIPS_PAGE_PATH);

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('new-application-count').textContent).toBe('1');
        });

        expect(api.markNotificationsAsRead).not.toHaveBeenCalled();
    });

    it('should show load error and no new application when employer notifications fail to load', async () => {
        // Arrange
        api.getNotifications.mockRejectedValueOnce(new Error('Network error'));

        // Act
        renderEmployerNotificationsAt();

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('notification-error').textContent).toBe('navbar.notificationLoadError');
        });

        expect(screen.getByTestId('new-application-count').textContent).toBe('0');
    });
});