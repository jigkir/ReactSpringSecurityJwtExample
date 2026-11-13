import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {getNotifications, markNotificationsAsRead} from '../api/Api.jsx';
import {usePolling} from "../../utils/usePolling.js";
import {ACCOUNT_STATUS} from "../../utils/AccountStatus.js";

const ROLE = {
    MANAGER: "MANAGER",
    STUDENT: "STUDENT",
    EMPLOYER: "EMPLOYER",
};

const NOTIFICATION_TYPE = {
    CV_APPROVED: "CV_APPROVED",
    CV_REJECTED: "CV_REJECTED",
    CV_SUBMITTED_FOR_REVIEW: "CV_SUBMITTED_FOR_REVIEW",

    INTERNSHIP_SUBMITTED_FOR_REVIEW: "INTERNSHIP_SUBMITTED_FOR_REVIEW",
    INTERNSHIP_OFFER_APPROVED: "INTERNSHIP_OFFER_APPROVED",
    INTERNSHIP_OFFER_REJECTED: "INTERNSHIP_OFFER_REJECTED",
    NEW_INTERNSHIP_OFFER: "NEW_INTERNSHIP_OFFER",

    NEW_INTERNSHIP_APPLICATION: "NEW_INTERNSHIP_APPLICATION",

    STUDENT_ACCESS_REQUESTED: "STUDENT_ACCESS_REQUESTED",

    INTERVIEW_CONVOCATION: "INTERVIEW_CONVOCATION",
    INTERVIEW_UPDATED: "INTERVIEW_UPDATED",

    INTERNSHIP_OFFERED: "INTERNSHIP_OFFERED",
};

export const TARGET_TYPE = {
    CV: "CV",
    INTERNSHIP_OFFER: "INTERNSHIP_OFFER",
    INTERNSHIP_APPLICATION: "INTERNSHIP_APPLICATION",
    STUDENT_ACCOUNT: "STUDENT_ACCOUNT",
    INTERVIEW: "INTERVIEW",
};

const PAGE = {
    STUDENT_CVS: "/portfolio",
    STUDENT_INTERNSHIPS: "/internship",
    STUDENT_INTERVIEWS: "/interviews",
    STUDENT_OFFERS: "/offers",
    MANAGER_CVS: "/manager/cvs",
    MANAGER_INTERNSHIPS: "/manager/internships",
    MANAGER_USERS: "/users",
    EMPLOYER_INTERNSHIPS: "/internships",
    EMPLOYER_APPLICATIONS: "/applications",
};

// A notification closes when its page is opened (clicking it opens that page).
// A `sessionScoped` notification targets an item listed by session: it closes only once its page
// shows that item, so opening the page on another session keeps it.
const NOTIFICATION_ITEMS = {
    [ROLE.MANAGER]: [
        {
            id: "cvPosted",
            notificationType: NOTIFICATION_TYPE.CV_SUBMITTED_FOR_REVIEW,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvNotification",
            to: PAGE.MANAGER_CVS,
            sessionScoped: true,
        },
        {
            id: "internshipPosted",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_SUBMITTED_FOR_REVIEW,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipSubmittedForReviewNotification",
            to: PAGE.MANAGER_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "accountExpired",
            notificationType: NOTIFICATION_TYPE.STUDENT_ACCESS_REQUESTED,
            targetType: TARGET_TYPE.STUDENT_ACCOUNT,
            labelKey: "navbar.pendingUserNotification",
            to: PAGE.MANAGER_USERS
        }
    ],
    [ROLE.STUDENT]: [
        {
            id: "internship",
            notificationType: NOTIFICATION_TYPE.NEW_INTERNSHIP_OFFER,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipNotification",
            to: PAGE.STUDENT_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "cvsApproved",
            notificationType: NOTIFICATION_TYPE.CV_APPROVED,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvApprovedNotification",
            to: PAGE.STUDENT_CVS
        },
        {
            id: "cvsRejected",
            notificationType: NOTIFICATION_TYPE.CV_REJECTED,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvRejectedNotification",
            to: PAGE.STUDENT_CVS
        },
        {
            id: "interviewConvocation",
            notificationType: NOTIFICATION_TYPE.INTERVIEW_CONVOCATION,
            targetType: TARGET_TYPE.INTERVIEW,
            labelKey: "navbar.interviewConvocationNotification",
            to: PAGE.STUDENT_INTERVIEWS,
            detailed: true, // one menu line per convocation (company, title, date)
        },
        {
            id: "interviewUpdated",
            notificationType: NOTIFICATION_TYPE.INTERVIEW_UPDATED,
            targetType: TARGET_TYPE.INTERVIEW,
            labelKey: "navbar.interviewUpdatedNotification",
            to: PAGE.STUDENT_INTERVIEWS,
            detailed: true,
        },
        {
            id: "internshipOffered",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFERED,
            targetType: TARGET_TYPE.INTERNSHIP_APPLICATION,
            labelKey: "navbar.internshipOfferedNotification",
            to: PAGE.STUDENT_OFFERS,
            detailed: true, // one menu line per offer (company, title)
        },
    ],
    [ROLE.EMPLOYER]: [
        {
            id: "internshipApproved",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_APPROVED,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipApprovedNotification",
            to: PAGE.EMPLOYER_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "internshipRejected",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_REJECTED,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipRejectedNotification",
            to: PAGE.EMPLOYER_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "newInternshipApplication",
            notificationType: NOTIFICATION_TYPE.NEW_INTERNSHIP_APPLICATION,
            targetType: TARGET_TYPE.INTERNSHIP_APPLICATION,
            labelKey: "navbar.newInternshipApplicationNotification",
            to: PAGE.EMPLOYER_APPLICATIONS,
            sessionScoped: true,
        },
    ],
};

const NO_ITEMS = [];

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

const hasToken = () => Boolean(localStorage.getItem("token"));

const countNotificationsByType = (notifications, notificationType) =>
    notifications.filter((notification) => notification.notificationType === notificationType).length;

const toNotificationIds = (notifications) => notifications.map((notification) => notification.id);

const NOTIFICATION_ERROR = {
    LOAD: "navbar.notificationLoadError",
    MARK_AS_READ: "navbar.notificationMarkAsReadError",
};

const NotificationsContext = createContext({
    items: [],
    notifications: [],
    errorKey: null,
    refresh: () => {
    },
    closeShownNotifications: () => {
    },
});

/**
 * Owns all notification data (fetching, counts, mark-as-read).
 * Consumers (NotificationMenu, any page) call useNotifications().
 *
 * items: [{id, count, labelKey, to, notificationType, targetType, sessionScoped}] — labels are translated by the consumer,
 * so they follow the language switch without refetching.
 */
export function NotificationsProvider({user, children, accountStatus}) {
    const {pathname} = useLocation();
    const role = normalizeRole(user);
    const userId = user?.id;

    const roleItems = NOTIFICATION_ITEMS[role] ?? NO_ITEMS;
    const [notifications, setNotifications] = useState([]);
    const [errorKey, setErrorKey] = useState(null);
    const requestId = useRef(0); // ignore responses from outdated requests

    const refresh = useCallback(async () => {
        const id = ++requestId.current;

        if (!userId || !hasToken()) {
            setNotifications([]);
            setErrorKey(null);
            return;
        }

        try {
            const list = await getNotifications();
            if (id !== requestId.current) return;
            setNotifications(Array.isArray(list) ? list : []);
            setErrorKey(null);
        } catch {
            if (id !== requestId.current) return;
            setNotifications([]);
            setErrorKey(NOTIFICATION_ERROR.LOAD);
        }
    }, [userId]);

    // Refetch on login/role change and on every route change
    useEffect(() => {
        void refresh();
    }, [refresh, pathname]);

    // Keeps counts up to date while the user stays on the same page
    usePolling(refresh, Boolean(userId) && accountStatus === ACCOUNT_STATUS.APPROVED);

    const items = useMemo(() => roleItems.map((item) => ({
        ...item,
        count: countNotificationsByType(notifications, item.notificationType),
    })), [roleItems, notifications]);

    const closeNotifications = useCallback(async (notificationIds) => {
        try {
            await markNotificationsAsRead(notificationIds);
            const closedIds = new Set(notificationIds);
            setNotifications((current) => current.filter((notification) => !closedIds.has(notification.id)));
        } catch {
            setErrorKey(NOTIFICATION_ERROR.MARK_AS_READ);
        }
    }, []);

    // Opening a notification's page closes it, whether reached from the menu or the navbar
    useEffect(() => {
        const typesClosedByPage = new Set(roleItems
            .filter((item) => item.to === pathname && !item.sessionScoped)
            .map((item) => item.notificationType));
        const notificationIds = toNotificationIds(notifications.filter((notification) => typesClosedByPage.has(notification.notificationType)));

        if (notificationIds.length > 0) void closeNotifications(notificationIds);
    }, [roleItems, notifications, pathname, closeNotifications]);

    const sessionScopedTypes = useMemo(
        () => new Set(roleItems.filter((item) => item.sessionScoped).map((item) => item.notificationType)),
        [roleItems],
    );

    // A page closes the session-scoped notifications of the items it shows
    const closeShownNotifications = useCallback((targetType, shownTargetIds) => {
        const shownIds = new Set(shownTargetIds);
        const notificationIds = toNotificationIds(notifications.filter((notification) =>
            sessionScopedTypes.has(notification.notificationType)
            && notification.targetType === targetType
            && shownIds.has(notification.targetId)));

        if (notificationIds.length > 0) void closeNotifications(notificationIds);
    }, [notifications, sessionScopedTypes, closeNotifications]);

    const value = useMemo(() => ({
        items,
        notifications,
        errorKey,
        refresh,
        closeShownNotifications,
    }), [items, notifications, errorKey, refresh, closeShownNotifications]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    return useContext(NotificationsContext);
}

/**
 * Closes the session-scoped notifications whose target the page shows.
 * shownTargetIds: ids of the listed items, or null while nothing is shown (loading, Home preview).
 * It must be memoized, otherwise the check runs on every render.
 */
export function useCloseShownNotifications(targetType, shownTargetIds) {
    const {closeShownNotifications} = useNotifications();

    useEffect(() => {
        if (shownTargetIds) closeShownNotifications(targetType, shownTargetIds);
    }, [targetType, shownTargetIds, closeShownNotifications]);
}