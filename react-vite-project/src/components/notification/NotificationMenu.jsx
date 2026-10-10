import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses, getNotificationMenuClasses} from '../../styles/AppStyles.jsx';
import Icon from '../../styles/Icon.jsx';
import {useNotifications} from './NotificationsProvider.jsx';

export default function NotificationMenu({dark}) {
    const {t} = useTranslation();
    const {items, errorKey} = useNotifications();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const theme = getNavbarClasses(dark);
    const menuClasses = getNotificationMenuClasses(dark);

    const active = items.filter((notif) => (notif.count ?? 0) > 0);
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
                    {active.length === 0 ? (
                        <p className={menuClasses.empty}>{t("navbar.noNotifications")}</p>
                    ) : (
                        <ul className={menuClasses.list}>
                            {active.map((notif) => (
                                <li key={notif.id} role="none">
                                    <div role="menuitem"
                                         className={`${menuClasses.item} flex items-center justify-between`}>
                                        <Link
                                            to={notif.to}
                                            className="min-w-0 flex-1 truncate"
                                            onClick={() => {
                                                setOpen(false);
                                                notif.onClick?.();
                                            }}
                                        >
                                            <span>{t(notif.labelKey, {amount: notif.count})}</span>
                                        </Link>
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