import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {useLocation} from "react-router-dom";
import {getNotifications, markNotificationsAsRead} from "../core/api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {ACCOUNT_STATUS} from "../../../utils/AccountStatus.js";
import {PATHS} from "../../../routes/AppRoutes.jsx";

const ROLE = {
    MANAGER: "MANAGER",
    STUDENT: "STUDENT",
    EMPLOYER: "EMPLOYER",
    TEACHER: "TEACHER"
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
    INTERNSHIP_OFFER_REFUSED: "INTERNSHIP_OFFER_REFUSED",

    STUDENT_ACCESS_REQUESTED: "STUDENT_ACCESS_REQUESTED",

    INTERVIEW_CONVOCATION: "INTERVIEW_CONVOCATION",
    INTERVIEW_UPDATED: "INTERVIEW_UPDATED",
    INTERVIEW_REFUSED: "INTERVIEW_REFUSED",
    INTERVIEW_CANCELLED_STUDENT_HIRED: "INTERVIEW_CANCELLED_STUDENT_HIRED",

    INTERNSHIP_OFFERED: "INTERNSHIP_OFFERED",

    NEW_CONTRACT: "NEW_CONTRACT",
    CONTRACT_TO_SIGN_BY_MANAGER: "CONTRACT_TO_SIGN_BY_MANAGER",
    CONTRACT_TO_SIGN_BY_EMPLOYER: "CONTRACT_TO_SIGN_BY_EMPLOYER",
    CONTRACT_TO_SIGN_BY_STUDENT: "CONTRACT_TO_SIGN_BY_STUDENT",
};

export const TARGET_TYPE = {
    CV: "CV",
    INTERNSHIP_OFFER: "INTERNSHIP_OFFER",
    INTERNSHIP_APPLICATION: "INTERNSHIP_APPLICATION",
    STUDENT_ACCOUNT: "STUDENT_ACCOUNT",
    INTERVIEW: "INTERVIEW",
    CONTRACT: "CONTRACT",
};

// A notification closes when its page is opened (clicking it opens that page).
// A `sessionScoped` notification targets an item listed by session: it closes only once its page
// shows that item, so opening the page on another session keeps it.
const buildNotificationItems = () => ({
    [ROLE.MANAGER]: [
        {
            id: "cvPosted",
            notificationType: NOTIFICATION_TYPE.CV_SUBMITTED_FOR_REVIEW,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvNotification",
            to: PATHS.MANAGER_CVS,
            sessionScoped: true,
        },
        {
            id: "internshipPosted",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_SUBMITTED_FOR_REVIEW,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipSubmittedForReviewNotification",
            to: PATHS.MANAGER_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "accountExpired",
            notificationType: NOTIFICATION_TYPE.STUDENT_ACCESS_REQUESTED,
            targetType: TARGET_TYPE.STUDENT_ACCOUNT,
            labelKey: "navbar.pendingUserNotification",
            to: PATHS.MANAGER_USERS
        },
        {
            id: "newContract",
            notificationType: NOTIFICATION_TYPE.NEW_CONTRACT,
            targetType: TARGET_TYPE.CONTRACT,
            labelKey: "navbar.newContractNotification",
            detailKey: "navbar.newContractNotificationDetail",
            to: PATHS.MANAGER_CONTRACTS,
            sessionScoped: true,
        },
        {
            id: "contractToSign",
            notificationType: NOTIFICATION_TYPE.CONTRACT_TO_SIGN_BY_MANAGER,
            targetType: TARGET_TYPE.CONTRACT,
            labelKey: "navbar.contractReadyToSignNotification",
            detailKey: "navbar.contractReadyToSignNotificationDetail",
            to: PATHS.MANAGER_CONTRACTS,
            sessionScoped: true,
        },
    ],
    [ROLE.STUDENT]: [
        {
            id: "internship",
            notificationType: NOTIFICATION_TYPE.NEW_INTERNSHIP_OFFER,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipNotification",
            to: PATHS.STUDENT_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "cvsApproved",
            notificationType: NOTIFICATION_TYPE.CV_APPROVED,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvApprovedNotification",
            to: PATHS.STUDENT_PORTFOLIO
        },
        {
            id: "cvsRejected",
            notificationType: NOTIFICATION_TYPE.CV_REJECTED,
            targetType: TARGET_TYPE.CV,
            labelKey: "navbar.cvRejectedNotification",
            to: PATHS.STUDENT_PORTFOLIO
        },
        {
            id: "interviewConvocation",
            notificationType: NOTIFICATION_TYPE.INTERVIEW_CONVOCATION,
            targetType: TARGET_TYPE.INTERVIEW,
            labelKey: "navbar.interviewConvocationNotification",
            to: PATHS.STUDENT_INTERVIEWS,
            detailed: true, // one menu line per convocation (company, title, date)
        },
        {
            id: "interviewUpdated",
            notificationType: NOTIFICATION_TYPE.INTERVIEW_UPDATED,
            targetType: TARGET_TYPE.INTERVIEW,
            labelKey: "navbar.interviewUpdatedNotification",
            to: PATHS.STUDENT_INTERVIEWS,
            detailed: true,
        },
        {
            id: "internshipOffered",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFERED,
            targetType: TARGET_TYPE.INTERNSHIP_APPLICATION,
            labelKey: "navbar.internshipOfferedNotification",
            to: PATHS.STUDENT_OFFERS,
            detailed: true, // one menu line per offer (company, title)
        },
        {
            id: "contractToSign",
            notificationType: NOTIFICATION_TYPE.CONTRACT_TO_SIGN_BY_STUDENT,
            targetType: TARGET_TYPE.CONTRACT,
            labelKey: "navbar.contractToSignNotification",
            to: PATHS.STUDENT_CONTRACTS,
            sessionScoped: true,
        },
    ],
    [ROLE.EMPLOYER]: [
        {
            id: "internshipApproved",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_APPROVED,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipApprovedNotification",
            to: PATHS.EMPLOYER_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "internshipRejected",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_REJECTED,
            targetType: TARGET_TYPE.INTERNSHIP_OFFER,
            labelKey: "navbar.internshipRejectedNotification",
            to: PATHS.EMPLOYER_INTERNSHIPS,
            sessionScoped: true,
        },
        {
            id: "newInternshipApplication",
            notificationType: NOTIFICATION_TYPE.NEW_INTERNSHIP_APPLICATION,
            targetType: TARGET_TYPE.INTERNSHIP_APPLICATION,
            labelKey: "navbar.newInternshipApplicationNotification",
            to: PATHS.EMPLOYER_APPLICATIONS,
            sessionScoped: true,
        },
        {
            id: "internshipOfferRefused",
            notificationType: NOTIFICATION_TYPE.INTERNSHIP_OFFER_REFUSED,
            targetType: TARGET_TYPE.INTERNSHIP_APPLICATION,
            labelKey: "navbar.internshipOfferRefusedNotification",
            to: PATHS.EMPLOYER_APPLICATIONS,
            sessionScoped: true,
        },
        {
            id: "interviewRefused",
            notificationType: NOTIFICATION_TYPE.INTERVIEW_REFUSED,
            targetType: TARGET_TYPE.INTERVIEW,
            labelKey: "navbar.interviewRefusedNotification",
            to: PATHS.EMPLOYER_INTERVIEWS,
        },
        {
            id: "interviewCancelled",
            notificationType: NOTIFICATION_TYPE.INTERVIEW_CANCELLED_STUDENT_HIRED,
            targetType: TARGET_TYPE.INTERVIEW,
            labelKey: "navbar.interviewCancelledNotification",
            to: PATHS.EMPLOYER_INTERVIEWS,
        },
        {
            id: "contractToSign",
            notificationType: NOTIFICATION_TYPE.CONTRACT_TO_SIGN_BY_EMPLOYER,
            targetType: TARGET_TYPE.CONTRACT,
            labelKey: "navbar.contractToSignNotification",
            to: PATHS.EMPLOYER_CONTRACTS,
            sessionScoped: true,
        },
    ],
    [ROLE.TEACHER]: []
});

// Built on first use: PATHS does not exist yet while the modules load (circular import)
let notificationItems = null;
const getNotificationItems = () => (notificationItems ??= buildNotificationItems());

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

    const roleItems = getNotificationItems()[role] ?? NO_ITEMS;
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