import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses, getNotificationMenuClasses} from '../../styles/AppStyles.jsx';
import Icon from '../../styles/Icon.jsx';
import {getStudentInterviews} from '../api/Api.jsx';
import {useNotifications} from './NotificationsProvider.jsx';

const INTERVIEW_TARGET = "INTERVIEW";
export const interviewAnchor = (id) => `interview-${id}`;

// Company, title and date of the student's interviews, loaded only while the menu is open
function useInterviewsById(enabled, version) {
    const [byId, setById] = useState({});

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        getStudentInterviews()
            .then((list) => {
                if (!cancelled && Array.isArray(list)) {
                    setById(Object.fromEntries(list.map((interview) => [interview.id, interview])));
                }
            })
            .catch(() => {
                // Without details, the row simply shows the generic title
            });
        return () => {
            cancelled = true;
        };
    }, [enabled, version]);

    return byId;
}

export default function NotificationMenu({dark}) {
    const {t, i18n} = useTranslation();
    const {items, notifications = [], errorKey} = useNotifications();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const theme = getNavbarClasses(dark);
    const menuClasses = getNotificationMenuClasses(dark);

    const active = items.filter((notif) => notif.count > 0);
    const total = active.reduce((sum, notif) => sum + notif.count, 0);

    const interviewCount = notifications.filter((n) => n.targetType === INTERVIEW_TARGET).length;
    const interviews = useInterviewsById(open && interviewCount > 0, interviewCount);

    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
    const formatWhen = (raw) => {
        const date = new Date(raw);
        return Number.isNaN(date.getTime())
            ? t("studentInterviews.invalidDate")
            : new Intl.DateTimeFormat(locale, {dateStyle: "long", timeStyle: "short"}).format(date);
    };

    // Regular items: one line with a counter. "detailed" items: one line per notification.
    const rows = active.flatMap((item) => item.detailed
        ? notifications
            .filter((n) => n.notificationType === item.notificationType)
            .map((n) => ({key: `${item.id}-${n.id ?? n.targetId}`, item, notification: n}))
        : [{key: item.id, item}]);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const renderRow = ({item, notification}) => {
        if (!notification) {
            return (
                <Link to={item.to} className={menuClasses.link} onClick={() => setOpen(false)}>
                    <span>{t(item.labelKey, {amount: item.count})}</span>
                </Link>
            );
        }

        const interview = interviews[notification.targetId];

        return (
            <Link
                to={{pathname: item.to, hash: `#${interviewAnchor(notification.targetId)}`}}
                className={menuClasses.link}
                onClick={() => setOpen(false)}
            >
                <span className="block font-semibold">{t(item.labelKey)}</span>
                {interview && (
                    <span className="block text-xs opacity-80">
                        {t("navbar.interviewNotificationDetail", {
                            company: interview.employerName,
                            title: interview.internshipTitle,
                            date: formatWhen(interview.interviewDate),
                        })}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((opened) => !opened)}
                aria-haspopup="menu"
                aria-expanded={open}
                className={`${theme.toggleBase} ${theme.toggleBtn}`}
            >
                <span className="relative inline-flex">
                    <Icon name="notifications" size={20}/>
                    {total > 0 && (
                        <span className={menuClasses.redDot}> {total} </span>
                    )}
                </span>
            </button>

            {open && (
                <div role="menu" className={menuClasses.panel}>
                    {errorKey && <p role="alert" className={menuClasses.error}>{t(errorKey)}</p>}
                    {rows.length === 0 ? (
                        <p className={menuClasses.empty}>{t("navbar.noNotifications")}</p>
                    ) : (
                        <ul className={menuClasses.list}>
                            {rows.map((row) => (
                                <li key={row.key} role="none">
                                    <div role="menuitem"
                                         className={`${menuClasses.item} flex items-center justify-between`}>
                                        {renderRow(row)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}