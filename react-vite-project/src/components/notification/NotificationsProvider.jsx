import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {getNotifications, getUnreadNotificationCount, markNotificationsAsRead} from '../api/Api.jsx';

const NOTIFICATION_TYPE = {
    CV_APPROVED: "CV_APPROVED",
    CV_REJECTED: "CV_REJECTED",
    CV_SUBMITTED_FOR_REVIEW: "CV_SUBMITTED_FOR_REVIEW",

    INTERNSHIP_SUBMITTED_FOR_REVIEW: "INTERNSHIP_SUBMITTED_FOR_REVIEW",
    INTERNSHIP_OFFER_APPROVED: "INTERNSHIP_OFFER_APPROVED",
    INTERNSHIP_OFFER_REJECTED: "INTERNSHIP_OFFER_REJECTED",
    NEW_INTERNSHIP_OFFER: "NEW_INTERNSHIP_OFFER",
};

const TARGET_TYPE = {
    CV: "CV",
    INTERNSHIP_OFFER: "INTERNSHIP_OFFER",
};

/**
 * Owns all notification data (fetching, counts, mark-as-read).
 * Consumers (NotificationMenu, any page) call useNotifications().
 *
 * items: [{id, count, labelKey, to, onClick?}]  — labels are translated by the consumer,
 * so they follow the language switch without refetching.
 */

const EMPTY_COUNTS = {
    manager: 0,
    internship: 0,
    cvApproved: 0,
    cvRejected: 0,
    internshipApproved: 0,
    internshipRejected: 0
};

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
    clearInternships: () => {
    },
});

export function NotificationsProvider({user, children}) {
    const {pathname} = useLocation();
    const role = normalizeRole(user);
    const userId = user?.id;

    const [counts, setCounts] = useState(EMPTY_COUNTS);
    const [errorKey, setErrorKey] = useState(null);
    const requestId = useRef(0); // ignore responses from outdated requests

    const refresh = useCallback(async () => {
        const id = ++requestId.current;

        if (!userId || !hasToken()) {
            setCounts(EMPTY_COUNTS);
            setErrorKey(null);
            return;
        }

        if (role === "MANAGER") {
            const [list] = await Promise.allSettled([
                getNotifications(),
            ]);
            if (id !== requestId.current) return;

            setErrorKey(list.status === "rejected" ? NOTIFICATION_ERROR.LOAD : null);

            const notifications = list.status === "fulfilled" && Array.isArray(list.value) ? list.value : [];
            setCounts({
                ...EMPTY_COUNTS,
                manager: countNotificationsByType(notifications, NOTIFICATION_TYPE.CV_SUBMITTED_FOR_REVIEW),
                internship: countNotificationsByType(notifications, NOTIFICATION_TYPE.INTERNSHIP_SUBMITTED_FOR_REVIEW),
            });
            return;
        }

        if (role === "STUDENT") {
            const [unread, list] = await Promise.allSettled([
                getUnreadNotificationCount(NOTIFICATION_TYPE.NEW_INTERNSHIP_OFFER),
                getNotifications(),
            ]);
            if (id !== requestId.current) return;

            const loadFailed = unread.status === "rejected" || list.status === "rejected";
            setErrorKey(loadFailed ? NOTIFICATION_ERROR.LOAD : null);

            const notifications = list.status === "fulfilled" && Array.isArray(list.value) ? list.value : [];
            setCounts({
                ...EMPTY_COUNTS,
                internship: unread.status === "fulfilled" && typeof unread.value === "number" ? unread.value : 0,
                cvApproved: countNotificationsByType(notifications, NOTIFICATION_TYPE.CV_APPROVED),
                cvRejected: countNotificationsByType(notifications, NOTIFICATION_TYPE.CV_REJECTED),
            });
            return;
        }

        if (role === "EMPLOYER") {
            const [list] = await Promise.allSettled([
                getNotifications(),
            ]);
            if (id !== requestId.current) return;

            setErrorKey(list.status === "rejected" ? NOTIFICATION_ERROR.LOAD : null);

            const notifications = list.status === "fulfilled" && Array.isArray(list.value) ? list.value : [];
            setCounts({
                ...EMPTY_COUNTS,
                internshipApproved: countNotificationsByType(notifications, NOTIFICATION_TYPE.INTERNSHIP_OFFER_APPROVED),
                internshipRejected: countNotificationsByType(notifications, NOTIFICATION_TYPE.INTERNSHIP_OFFER_REJECTED),
            });
            return;
        }

        setCounts(EMPTY_COUNTS);
    }, [role, userId]);

    // Refetch on login/role change and on every route change
    useEffect(() => {
        void refresh();
    }, [refresh, pathname]);

    // Students: opening /cv marks CV approved/rejected notifications as read
    useEffect(() => {
        if (role !== "STUDENT" || pathname !== "/cv") return;
        if (counts.cvApproved + counts.cvRejected === 0) return;

        let cancelled = false;
        markNotificationsAsRead(TARGET_TYPE.CV)
            .then(() => {
                if (!cancelled) setCounts((c) => ({...c, cvApproved: 0, cvRejected: 0}));
            })
            .catch(() => {
                if (!cancelled) setErrorKey(NOTIFICATION_ERROR.MARK_AS_READ);
            });

        return () => {
            cancelled = true;
        };
    }, [role, pathname, counts.cvApproved, counts.cvRejected]);

    const clearInternships = useCallback(() => {
        markNotificationsAsRead(TARGET_TYPE.INTERNSHIP_OFFER)
            .then(() => setCounts((c) => ({...c, internship: 0})))
            .catch(() => setErrorKey(NOTIFICATION_ERROR.MARK_AS_READ));
    }, []);

    const markAsReadAndRefresh = useCallback((targetType) => {
        markNotificationsAsRead(targetType)
            .then(refresh)
            .catch(() => setErrorKey(NOTIFICATION_ERROR.MARK_AS_READ));
    }, [refresh]);

    const items = useMemo(() => {
        if (role === "MANAGER") {
            return [{
                id: "cvPosted",
                count: counts.manager,
                labelKey: "navbar.cvNotification",
                to: "/manager/cvs",
            },
                {
                    id: "internshipPosted",
                    count: counts.internship,
                    labelKey: "navbar.internshipNotification",
                    to: "/manager/internships",
                    onClick: clearInternships,
                }
            ];
        }
        if (role === "STUDENT") {
            return [
                {
                    id: "internship",
                    count: counts.internship,
                    labelKey: "navbar.internshipNotification",
                    to: "/internship",
                    onClick: clearInternships,
                },
                {
                    id: "cvsApproved",
                    count: counts.cvApproved,
                    labelKey: "navbar.cvApprovedNotification",
                    to: "/cv",
                },
                {
                    id: "cvsRejected",
                    count: counts.cvRejected,
                    labelKey: "navbar.cvRejectedNotification",
                    to: "/cv",
                },
            ];
        }
        if (role === "EMPLOYER") {
            const markInternshipReviewsAsRead = () => markAsReadAndRefresh(TARGET_TYPE.INTERNSHIP_OFFER);
            return [
                {
                    id: "internshipApproved",
                    count: counts.internshipApproved,
                    labelKey: "navbar.internshipApprovedNotification",
                    to: "/internships",
                    onClick: markInternshipReviewsAsRead,
                },
                {
                    id: "internshipRejected",
                    count: counts.internshipRejected,
                    labelKey: "navbar.internshipRejectedNotification",
                    to: "/internships",
                    onClick: markInternshipReviewsAsRead,
                },
            ];
        }
        return [];
    }, [role, counts, clearInternships, markAsReadAndRefresh]);

    const value = useMemo(() => ({
        items,
        errorKey,
        refresh,
        clearInternships
    }), [items, errorKey, refresh, clearInternships]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    return useContext(NotificationsContext);
}