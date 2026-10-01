import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses, getNotificationMenuClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import {markNotificationAsRead} from "./api/Api.jsx";

export default function NotificationMenu({notifications = [], dark, onNotificationRead, studentId}) {
    const {t} = useTranslation();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const theme = getNavbarClasses(dark);
    const menuClasses = getNotificationMenuClasses(dark);

    const active = notifications.filter((notif) => (notif.count ?? 0) > 0);
    const total = active.reduce((sum, notif) => sum + notif.count, 0);

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

    const handleMarkAsRead = async (notificationId, e) => {
        e.stopPropagation(); // Prevents triggering link clicks or closing menu
        try {
            //await markNotificationAsRead(studentId, notificationId);
            console.log("Read")

            // Optional: Notify parent component to update state/re-fetch
            if (onNotificationRead) {
                onNotificationRead(notificationId);
            }
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
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
                        <span className={`${menuClasses.redDot}`}> {total} </span>
                    )}
                </span>
            </button>

            {open && (
                <div role="menu" className={menuClasses.panel}>
                    {active.length === 0 ? (
                        <p className={menuClasses.empty}>{t("navbar.noNotifications")}</p>
                    ) : (
                        <ul className={menuClasses.list}>
                            {active.map((notif) => {
                                return (
                                    <li key={notif.id} role="none">
                                        {notif.to ? (
                                            <div role="menuitem" className={`${menuClasses.item} flex items-center justify-between`}>
                                                <Link
                                                    to={notif.to}
                                                    className="min-w-0 flex-1 truncate"
                                                    onClick={() => setOpen(false)}
                                                >
                                                    <span>{notif.label}</span>
                                                </Link>
                                                <button
                                                    className="bg-red-500 rounded px-3 py-1 text-white text-sm ml-2"
                                                    onClick={(e) => handleMarkAsRead(notifications.id, e)}
                                                >
                                                    {t("navbar.dismissButton")}
                                                </button>
                                            </div>
                                        ) : (
                                            <div role="menuitem" className={menuClasses.item}>{content}</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}