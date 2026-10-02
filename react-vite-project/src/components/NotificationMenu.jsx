import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses, getNotificationMenuClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';

export default function NotificationMenu({notifications = [], dark}) {
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
                                            <Link to={notif.to} role="menuitem" className={menuClasses.item}
                                                  onClick={() => setOpen(false)}>
                                                <span className="min-w-0 flex-1">{notif.label}</span>
                                            </Link>
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