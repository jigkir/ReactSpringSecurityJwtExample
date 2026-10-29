import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {getNotifications, markNotificationsAsRead} from '../api/Api.jsx';
import {usePolling} from "../../utils/usePolling.js";

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
};

const TARGET_TYPE = {
    CV: "CV",
    INTERNSHIP_OFFER: "INTERNSHIP_OFFER",
    INTERNSHIP_APPLICATION: "INTERNSHIP_APPLICATION",
};

const PAGE = {
    STUDENT_CVS: "/cv",
    STUDENT_INTERNSHIPS: "/internship",
    MANAGER_CVS: "/manager/cvs",
    MANAGER_INTERNSHIPS: "/manager/internships",
    EMPLOYER_INTERNSHIPS: "/internships",
    EMPLOYER_APPLICATIONS: "/applications",
};

// A notification closes when its page is opened (clicking it opens that page)
const NOTIFICATION_ITEMS = {
    [ROLE.MANAGER]: [
        {
            id: "cvPosted",
            notificationType: NOTIFICATION_TYPE.CV_SUBMITTED_FOR_REVIEW,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvNotification",
            to: PAGE.MANAGER_CVS
        },
        {
            id: "internshipPosted",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_SUBMITTED_FOR_REVIEW,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipSubmittedForReviewNotification",
            to: PAGE.MANAGER_INTERNSHIPS
        },
    ],
    [ROLE.STUDENT]: [
        {
            id: "internship",
            notificationType: NOTIFICATION_TYPE.NEW_INTERNSHIP_OFFER,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipNotification",
            to: PAGE.STUDENT_INTERNSHIPS
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
    ],
    [ROLE.EMPLOYER]: [
        {
            id: "internshipApproved",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_APPROVED,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipApprovedNotification",
            to: PAGE.EMPLOYER_INTERNSHIPS
        },
        {
            id: "internshipRejected",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_REJECTED,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipRejectedNotification",
            to: PAGE.EMPLOYER_INTERNSHIPS
        },
        {
            id: "newInternshipApplication",
            notificationType: NOTIFICATION_TYPE.NEW_INTERNSHIP_APPLICATION,
            targetType: TARGET_TYPE.INTERNSHIP_APPLICATION,
            labelKey: "navbar.newInternshipApplicationNotification",
            to: PAGE.EMPLOYER_APPLICATIONS
        },
    ],
};

const NO_ITEMS = [];

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

const hasToken = () => Boolean(localStorage.getItem("token"));

const countNotificationsByType = (notifications, notificationType) =>
    notifications.filter((notification) => notification.notificationType === notificationType).length;

const NOTIFICATION_ERROR = {
    LOAD: "navbar.notificationLoadError",
    MARK_AS_READ: "navbar.notificationMarkAsReadError",
};

const NotificationsContext = createContext({
    items: [],
    errorKey: null,
    refresh: () => {
    },
});

/**
 * Owns all notification data (fetching, counts, mark-as-read).
 * Consumers (NotificationMenu, any page) call useNotifications().
 *
 * items: [{id, count, labelKey, to, notificationType, targetType}] — labels are translated by the consumer,
 * so they follow the language switch without refetching.
 */
export function NotificationsProvider({user, children}) {
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
    usePolling(refresh, Boolean(userId));

    const items = useMemo(() => roleItems.map((item) => ({
        ...item,
        count: countNotificationsByType(notifications, item.notificationType),
    })), [roleItems, notifications]);

    // Opening a notification's page closes it, whether reached from the menu or the navbar
    useEffect(() => {
        const targetTypesToClose = new Set(items
            .filter((item) => item.to === pathname && item.count > 0)
            .map((item) => item.targetType));

        let cancelled = false;
        targetTypesToClose.forEach((targetType) => {
            markNotificationsAsRead(targetType)
                .then(() => {
                    if (!cancelled) setNotifications((current) => current.filter((notification) => notification.targetType !== targetType));
                })
                .catch(() => {
                    if (!cancelled) setErrorKey(NOTIFICATION_ERROR.MARK_AS_READ);
                });
        });

        return () => {
            cancelled = true;
        };
    }, [items, pathname]);

    const value = useMemo(() => ({
        items,
        errorKey,
        refresh
    }), [items, errorKey, refresh]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    return useContext(NotificationsContext);
}