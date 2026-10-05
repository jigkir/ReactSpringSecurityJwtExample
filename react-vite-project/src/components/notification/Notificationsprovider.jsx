import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {
    getManagerNotifications,
    getStudentNotifications,
    getUnreadNotificationCount,
    markCvNotificationsAsRead,
    markInternshipNotificationAsRead,
} from '../api/Api.jsx';

/**
 * Owns all notification data (fetching, counts, mark-as-read).
 * Consumers (NotificationMenu, any page) call useNotifications().
 *
 * items: [{id, count, labelKey, to, onClick?}]  — labels are translated by the consumer,
 * so they follow the language switch without refetching.
 */

const EMPTY_COUNTS = {manager: 0, internship: 0, cvApproved: 0, cvRejected: 0};

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

const hasToken = () => Boolean(localStorage.getItem("token"));

const NotificationsContext = createContext({
    items: [],
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
    const requestId = useRef(0); // ignore responses from outdated requests

    const refresh = useCallback(async () => {
        const id = ++requestId.current;

        if (!userId || !hasToken()) {
            setCounts(EMPTY_COUNTS);
            return;
        }

        if (role === "MANAGER") {
            try {
                const data = await getManagerNotifications();
                if (id !== requestId.current) return;
                setCounts({...EMPTY_COUNTS, manager: Array.isArray(data) ? data.length : 0});
            } catch (err) {
                console.error("Manager notifications failed:", err?.status, err?.body);
            }
            return;
        }

        if (role === "STUDENT") {
            const [unread, list] = await Promise.allSettled([
                getUnreadNotificationCount(),
                getStudentNotifications(),
            ]);
            if (id !== requestId.current) return;

            if (unread.status === "rejected") console.error("Student notification error:", unread.reason);
            if (list.status === "rejected") console.error("Student notification error:", list.reason);

            const notifications = list.status === "fulfilled" && Array.isArray(list.value) ? list.value : [];
            setCounts({
                ...EMPTY_COUNTS,
                internship: unread.status === "fulfilled" && typeof unread.value === "number" ? unread.value : 0,
                cvApproved: notifications.filter((n) => n.notificationType === "CV_APPROVED").length,
                cvRejected: notifications.filter((n) => n.notificationType === "CV_REJECTED").length,
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
        markCvNotificationsAsRead()
            .then(() => {
                if (!cancelled) setCounts((c) => ({...c, cvApproved: 0, cvRejected: 0}));
            })
            .catch((error) => console.error("Mark CV notifications failed:", error));

        return () => {
            cancelled = true;
        };
    }, [role, pathname, counts.cvApproved, counts.cvRejected]);

    const clearInternships = useCallback(() => {
        markInternshipNotificationAsRead()
            .then(() => setCounts((c) => ({...c, internship: 0})))
            .catch((error) => console.error("Mark internship notifications failed:", error));
    }, []);

    const items = useMemo(() => {
        if (role === "MANAGER") {
            return [{
                id: "cvPosted",
                count: counts.manager,
                labelKey: "navbar.cvNotification",
                to: "/manager/cvs",
            }];
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
        return [];
    }, [role, counts, clearInternships]);

    const value = useMemo(() => ({items, refresh, clearInternships}), [items, refresh, clearInternships]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    return useContext(NotificationsContext);
}