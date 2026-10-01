import {Link, NavLink, useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useEffect, useRef, useState} from 'react';
import {getNavbarClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import NotificationMenu from './NotificationMenu.jsx';

import {getManagerNotifications, getStudentNotifications, getUnreadNotificationCount, markNotificationAsRead} from './api/Api.jsx';

// Links by role. `end` = only active on the exact path (needed for "/" and "/home").
const NAV_BY_ROLE = {
    STUDENT: [{to: "/cv", label: "CV"}],
    MANAGER: [{to: "/manager/cvs", label: "CV"}],
    EMPLOYER: [{to: "/post", labelKey: "navbar.postInternship"}],
    TEACHER: [],
};

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

function useNotifications(role, t, user) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!user?.id) {
            setCount(0);
            return;
        }
        let cancelled = false;

        if (role === "MANAGER") {
            getManagerNotifications(user.id)
                .then((data) => {
                    if (!cancelled) setCount(Array.isArray(data) ? data.length : 0);
                })
                .catch((err) => {
                    console.error("Manager notifications failed:", err?.status, err?.body);
                });
        } else if (role === "STUDENT") {
            getUnreadNotificationCount(user.id)
                .then((unreadCount) => {
                    if (!cancelled) setCount(typeof unreadCount === 'number' ? unreadCount : 0);
                })
                .catch((error) => {
                    console.error("Student notification error:", error);
                });
        }

        return () => {
            cancelled = true;
        };
    }, [role, user?.id]);

    // If there are no notifications, return an empty array immediately
    if (count === 0) return [];

    // Return the correct notification based on the role
    if (role === "MANAGER") {
        return [{
            id: "cvPosted",
            count,
            label: t("navbar.cvNotification", {amount: count}),
            to: "/manager/cvs",
        }];
    }

    if (role === "STUDENT") {
        return [{
            id: "internship",
            count,
            label: t("navbar.internshipNotification", {amount: count}),
            to: "/internship",
        }];
    }

    return [];
}

function Navbar({user, dark, toggleDark}) {
    const {t, i18n} = useTranslation();
    const location = useLocation();
    const theme = getNavbarClasses(dark);

    // Mobile dropdowns
    const [menuOpen, setMenuOpen] = useState(false);
    const [authMenuOpen, setAuthMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const authRef = useRef(null);

    // Close both on route change
    useEffect(() => {
        setMenuOpen(false);
        setAuthMenuOpen(false);
    }, [location.pathname]);

    // Close on outside click / Escape
    useEffect(() => {
        if (!menuOpen && !authMenuOpen) return;
        const onPointerDown = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
            if (authRef.current && !authRef.current.contains(e.target)) setAuthMenuOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") {
                setMenuOpen(false);
                setAuthMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen, authMenuOpen]);

    const role = normalizeRole(user);
    const isLoggedIn = user?.isLoggedIn ?? false;
    const homePath = isLoggedIn ? "/home" : "/";

    const isEn = (i18n.resolvedLanguage ?? i18n.language ?? "fr").startsWith("en");
    const toggleLang = () => i18n.changeLanguage(isEn ? "fr" : "en");

    const notifications = useNotifications(role, t, user);

    const formatRole = (r) => {
        if (!r) return "";
        const name = r.toLowerCase();
        const key = `navbar.${name}`;
        const translated = t(key);
        return translated !== key ? translated : name.charAt(0).toUpperCase() + name.slice(1);
    };

    const navItems = [
        {to: homePath, label: t("navbar.accueil"), end: true},
        {to: "/about", label: t("navbar.about")},
        ...(isLoggedIn ? (NAV_BY_ROLE[role] ?? []) : []).map((item) => ({
            ...item,
            label: item.labelKey ? t(item.labelKey) : item.label,
        })),
    ];

    const linkClass = ({isActive}) =>
        `${theme.linkBase} ${isActive ? theme.linkActive : theme.linkIdle}`;

    // Mobile dropdown styling
    const dropdownPanel = `absolute mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${
        dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
    }`;
    const mobileLinkClass = ({isActive}) =>
        `block px-4 py-2 text-sm ${
            isActive
                ? (dark ? "bg-slate-700 text-white" : "bg-indigo-50 text-indigo-700")
                : (dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100")
        }`;
    const mobileAuthLink = `block px-4 py-2 text-sm ${
        dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100"
    }`;

    const authBtnDesktop = "text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400";

    const handleNotificationRead = async (notificationId) => {
        try {
            await markNotificationAsRead(user.id, notificationId);
            // Optionally, you can trigger a re-fetch or state update here if needed
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    return (
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme.header}`}>
            <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    {/* ───────── Left side ───────── */}
                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Desktop brand */}
                        <Link to={homePath}
                              className={`hidden md:flex items-center gap-2 font-bold text-lg tracking-tight shrink-0 transition-colors duration-150 ${theme.brand}`}>
                            {t("navbar.appName")}
                        </Link>

                        {/* Desktop nav (bell always visible) */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map(({to, label, end}) => (
                                <NavLink key={to} to={to} end={end} className={linkClass}>
                                    {label}
                                </NavLink>
                            ))}
                            <NotificationMenu notifications={notifications} dark={dark} studentId={user?.id} onNotificationRead={handleNotificationRead}/>
                        </nav>

                        {/* Mobile: app name doubles as the pages dropdown button */}
                        <div ref={menuRef} className="relative md:hidden">
                            <button
                                onClick={() => {
                                    setMenuOpen((o) => !o);
                                    setAuthMenuOpen(false);
                                }}
                                className={`p-1 -ml-1 rounded-lg font-bold text-base tracking-tight flex items-center gap-1.5 ${theme.brand}`}
                                aria-label={t("navbar.pagesMenu")}
                                aria-expanded={menuOpen}
                            >
                                <span>{t("navbar.appName")}</span>
                                <svg className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                          d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>

                            {menuOpen && (
                                <div className={`${dropdownPanel} left-0`}>
                                    {navItems.map(({to, label, end}) => (
                                        <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
                                            {label}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ───────── Right side ───────── */}
                    <div className="flex items-center gap-2 md:gap-3 ml-auto">
                        {/* Mobile bell (always visible, in the top bar) */}
                        <div className="md:hidden">
                            <NotificationMenu notifications={notifications} dark={dark} studentId={user?.id} onNotificationRead={handleNotificationRead}/>
                        </div>

                        <button onClick={toggleLang}
                                className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1`}
                                aria-label={isEn ? t("navbar.switchToFrench") : t("navbar.switchToEnglish")}>
                            {isEn ? t("navbar.switchFench") : t("navbar.switchEnglish")}
                        </button>

                        <button onClick={toggleDark}
                                className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1`}
                                aria-label={dark ? t("navbar.switchToLight") : t("navbar.switchToDark")}>
                            <Icon name={dark ? "light_mode" : "dark_mode"} size={16}/>
                            <span className="hidden md:inline">
                                {dark ? t("navbar.lightmode") : t("navbar.darkmode")}
                            </span>
                        </button>

                        {/* Desktop greeting + auth */}
                        <div className="hidden md:flex items-center gap-3 ml-2">
                            {isLoggedIn && (
                                <div className={`flex items-center gap-2 text-sm ${theme.greeting}`}>
                                    <span>{t("navbar.hello")}</span>
                                    <span className={`font-semibold ${theme.greetingName}`}>
                                        {user.firstName} {user.lastName}
                                    </span>
                                    {role && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${theme.badge}`}>
                                            {formatRole(role)}
                                        </span>
                                    )}
                                </div>
                            )}

                            {isLoggedIn ? (
                                <NavLink to="/logout" className={linkClass}>{t("navbar.disconnect")}</NavLink>
                            ) : (
                                <>
                                    <Link to="/login" className={`${authBtnDesktop} ${theme.authBtn}`}>
                                        {t("navbar.login")}
                                    </Link>
                                    <Link to="/signup" className={`${authBtnDesktop} ${theme.signupBtn}`}>
                                        {t("navbar.signup")}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile account dropdown */}
                        <div ref={authRef} className="relative md:hidden">
                            <button
                                onClick={() => {
                                    setAuthMenuOpen((o) => !o);
                                    setMenuOpen(false);
                                }}
                                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 ${theme.authBtn}`}
                                aria-label={t("navbar.accountMenu")}
                                aria-expanded={authMenuOpen}
                            >
                                <span className="max-w-[6rem] truncate">
                                    {isLoggedIn ? (user.firstName || t("navbar.account")) : t("navbar.login")}
                                </span>
                                <svg
                                    className={`h-4 w-4 shrink-0 transition-transform ${authMenuOpen ? "rotate-180" : ""}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>

                            {authMenuOpen && (
                                <div className={`${dropdownPanel} right-0`}>
                                    {isLoggedIn ? (
                                        <>
                                            <div
                                                className={`px-4 py-2 text-xs border-b ${dark ? "border-slate-700 text-slate-400" : "border-gray-100 text-gray-500"}`}>
                                                {user.firstName} {user.lastName} ({formatRole(role)})
                                            </div>
                                            <Link to="/logout"
                                                  className="block px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">
                                                {t("navbar.disconnect")}
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/login" className={mobileAuthLink}>{t("navbar.login")}</Link>
                                            <Link to="/signup" className={mobileAuthLink}>{t("navbar.signup")}</Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;