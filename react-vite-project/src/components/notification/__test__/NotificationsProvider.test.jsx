import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {BrowserRouter, MemoryRouter} from 'react-router-dom';
import {NotificationsProvider, useNotifications} from '../NotificationsProvider';
import * as api from '../../api/Api.jsx';
import {REFRESH_INTERVAL_MS} from "../../../utils/usePolling.js";
import {ACCOUNT_STATUS} from "../../../utils/AccountStatus.js";

vi.mock('../../api/Api.jsx', () => ({
    getNotifications: vi.fn(),
    markNotificationsAsRead: vi.fn(),
}));

const SHOWN_INTERNSHIP_ID = 40;

function TestNotificationConsumer() {
    const {items, closeShownNotifications} = useNotifications();
    const internshipItem = items.find(item => item.id === 'internshipPosted');

    return (
        <div>
            <button type="button" onClick={() => closeShownNotifications('INTERNSHIP_OFFER', [SHOWN_INTERNSHIP_ID])}>
                showInternships
            </button>
            <span data-testid="internship-count">{internshipItem?.count}</span>
            <span data-testid="internship-label">{internshipItem?.labelKey}</span>
        </div>
    );
}

const renderManagerNotificationsAt = (path) => render(
    <MemoryRouter initialEntries={[path]}>
        <NotificationsProvider user={{id: 1, role: 'MANAGER'}}>
            <TestNotificationConsumer/>
        </NotificationsProvider>
    </MemoryRouter>
);

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

    it('should keep internship notifications unread when manager opens the internships page of another session', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {
                id: 10,
                notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW',
                targetType: 'INTERNSHIP_OFFER',
                targetId: SHOWN_INTERNSHIP_ID
            }
        ]);

        // Act
        renderManagerNotificationsAt('/manager/internships');

        // Assert
        await waitFor(() => expect(screen.getByTestId('internship-count').textContent).toBe('1'));
        expect(api.markNotificationsAsRead).not.toHaveBeenCalled();
    });

    it('should close internship notification when manager internships page shows its offer', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {
                id: 10,
                notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW',
                targetType: 'INTERNSHIP_OFFER',
                targetId: SHOWN_INTERNSHIP_ID
            },
            {id: 11, notificationType: 'INTERNSHIP_SUBMITTED_FOR_REVIEW', targetType: 'INTERNSHIP_OFFER', targetId: 41}
        ]);
        api.markNotificationsAsRead.mockResolvedValueOnce();
        renderManagerNotificationsAt('/manager/internships');
        await waitFor(() => expect(screen.getByTestId('internship-count').textContent).toBe('2'));

        // Act
        fireEvent.click(screen.getByText('showInternships'));

        // Assert
        await waitFor(() => expect(screen.getByTestId('internship-count').textContent).toBe('1'));
        expect(api.markNotificationsAsRead).toHaveBeenCalledWith([10]);
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
const APPLICATIONS_PAGE_PATH = '/applications';
const NEW_INTERNSHIP_APPLICATION = 'NEW_INTERNSHIP_APPLICATION';

const SHOWN_APPLICATION_ID = 30;

function NewInternshipApplicationNotificationDisplay() {
    const {items, errorKey, closeShownNotifications} = useNotifications();
    const newApplicationItem = items.find(item => item.id === 'newInternshipApplication');

    return (
        <div>
            <button type="button"
                    onClick={() => closeShownNotifications('INTERNSHIP_APPLICATION', [SHOWN_APPLICATION_ID])}>
                showApplications
            </button>
            <span data-testid="new-application-count">{newApplicationItem?.count}</span>
            <span data-testid="new-application-label">{newApplicationItem?.labelKey}</span>
            <span data-testid="notification-error">{errorKey}</span>
        </div>
    );
}

const renderEmployerNotificationsAt = (path = '/') => render(
    <MemoryRouter initialEntries={[path]}>
        <NotificationsProvider user={EMPLOYER} accountStatus={ACCOUNT_STATUS.APPROVED}>
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
        vi.useRealTimers();
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

    it('should increment new internship application count when a student applies while employer stays on the page', async () => {
        // Arrange
        vi.useFakeTimers({shouldAdvanceTime: true});

        api.getNotifications
            .mockResolvedValueOnce([{id: 20, notificationType: NEW_INTERNSHIP_APPLICATION}])
            .mockResolvedValueOnce([
                {id: 20, notificationType: NEW_INTERNSHIP_APPLICATION},
                {id: 21, notificationType: NEW_INTERNSHIP_APPLICATION}
            ]);

        renderEmployerNotificationsAt();

        await waitFor(() => {
            expect(screen.getByTestId('new-application-count').textContent).toBe('1');
        });

        // Act
        await vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS);

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('new-application-count').textContent).toBe('2');
        });
    });

    it('should keep new internship application notifications unread when employer opens applications page of another session', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {
                id: 20,
                notificationType: NEW_INTERNSHIP_APPLICATION,
                targetType: 'INTERNSHIP_APPLICATION',
                targetId: SHOWN_APPLICATION_ID
            }
        ]);

        // Act
        renderEmployerNotificationsAt(APPLICATIONS_PAGE_PATH);

        // Assert
        await waitFor(() => expect(screen.getByTestId('new-application-count').textContent).toBe('1'));
        expect(api.markNotificationsAsRead).not.toHaveBeenCalled();
    });
});

describe('NotificationsProvider - Student interview notifications', () => {

    beforeEach(() => {
        localStorage.setItem('token', 'fake-jwt-token');
    });

    afterEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should count interview convocations and updates for a student', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {id: 1, notificationType: 'INTERVIEW_CONVOCATION', targetType: 'INTERVIEW', targetId: 7},
            {id: 2, notificationType: 'INTERVIEW_UPDATED', targetType: 'INTERVIEW', targetId: 8},
        ]);

        function InterviewCounts() {
            const {items} = useNotifications();
            return (
                <span data-testid="counts">
                    {items.filter((item) => item.targetType === 'INTERVIEW').map((item) => item.count).join(',')}
                </span>
            );
        }

        // Act
        render(
            <MemoryRouter>
                <NotificationsProvider user={{id: 3, role: 'STUDENT'}} accountStatus={ACCOUNT_STATUS.APPROVED}>
                    <InterviewCounts/>
                </NotificationsProvider>
            </MemoryRouter>
        );

        // Assert
        await waitFor(() => expect(screen.getByTestId('counts').textContent).toBe('1,1'));
    });

    it('should close interview notifications when the student opens the interviews page', async () => {
        // Arrange
        api.getNotifications.mockResolvedValueOnce([
            {id: 1, notificationType: 'INTERVIEW_CONVOCATION', targetType: 'INTERVIEW', targetId: 7},
        ]);
        api.markNotificationsAsRead.mockResolvedValueOnce();

        // Act
        render(
            <MemoryRouter initialEntries={['/interviews']}>
                <NotificationsProvider user={{id: 3, role: 'STUDENT'}} accountStatus={ACCOUNT_STATUS.APPROVED}>
                    <span/>
                </NotificationsProvider>
            </MemoryRouter>
        );

        // Assert
        await waitFor(() => expect(api.markNotificationsAsRead).toHaveBeenCalledWith([1]));
    });
});