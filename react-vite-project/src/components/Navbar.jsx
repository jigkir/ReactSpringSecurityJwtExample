import {createPortal} from "react-dom";
import {Link, NavLink, useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useEffect, useRef, useState} from 'react';
import {getNavbarClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import NotificationMenu from './NotificationMenu.jsx';

// Links by role. Every label is a translation key (`labelKey`).
const NAV_BY_ROLE = {
    STUDENT: [{to: "/cv", labelKey: "navbar.cv"}],
    MANAGER: [
        {to: "/manager/cvs", labelKey: "navbar.cv"},
        {to: "/manager/internships", labelKey: "navbar.internships"},
    ],
    EMPLOYER: [{to: "/post", labelKey: "navbar.postInternship"}],
    TEACHER: [],
};

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

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
                            {isLoggedIn && <NotificationMenu dark={dark}/>}
                        </nav>

                        {/* Mobile: app name doubles as the pages dropdown button */}
                        <div ref={menuRef} className="md:hidden">
                            <div className={`p-1.5 -ml-1.5 rounded-lg font-bold flex items-center gap-2 ${theme.brand}`}>
                                {/* Burger Button - added flex items-center */}
                                <button
                                    onClick={() => {
                                        setMenuOpen((o) => !o);
                                        setAuthMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center"
                                    aria-label={t("navbar.pagesMenu")}
                                    aria-expanded={menuOpen}
                                >
                                    <Icon name="menu" size={24}/>
                                </button>

                                {/* Text - added leading-none to remove line-height padding */}
                                <span className="text-2xl leading-none tracking-tight">
                                    {t("navbar.appName")}
                                </span>
                            </div>

                            {/* Side Menu Drawer & Backdrop */}
                            {menuOpen && createPortal(
                                <>
                                    {/* Backdrop Overlay */}
                                    <div
                                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
                                        onClick={() => setMenuOpen(false)}
                                    />

                                    {/* Slide-out Panel */}
                                    <div className={`fixed inset-y-0 left-0 border-r w-64 sm:w-72 z-50 shadow-2xl flex flex-col overflow-hidden  ${dark ? "bg-slate-800/95  border-slate-700" : "bg-white border-gray-200"}`}>
                                        {/* Header inside side menu */}
                                        <div className={`flex items-center justify-between pb-4 mb-4 border-b -mx-1 -mt-1 pl-4 pt-4 ${ dark ? "bg-slate-800/95 border-slate-700" : "bg-indigo-600 border-indigo-700"} `}>
                                            <span className={`font-bold text-2xl tracking-tight ${dark ? "text-gray-500" : "text-white"}`}>
                                                {t("navbar.appName")}
                                            </span>

                                            <button
                                                onClick={() => setMenuOpen(false)}
                                                className={`p-1.5 rounded-lg ${dark ? "text-gray-400 hover:text-red-600" : "text-white hover:text-red-600"}`}
                                                aria-label="Close menu"
                                            >
                                                <Icon name="close" size={24}/>
                                            </button>
                                        </div>

                                        {/* Navigation Links */}
                                        <div>
                                            <nav className="flex flex-col gap-1">
                                                {navItems.map(({to, label, end}) => (
                                                    <NavLink
                                                        key={to}
                                                        to={to}
                                                        end={end}
                                                        className={mobileLinkClass}
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        {label}
                                                    </NavLink>
                                                ))}
                                            </nav>
                                        </div>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>
                        {/* Mobile bell (always visible, in the top bar) */}
                        <div className="md:hidden">
                            {isLoggedIn && <NotificationMenu dark={dark}/>}
                        </div>
                    </div>

                    {/* ───────── Right side ───────── */}
                    <div className="flex items-center gap-2 md:gap-3 ml-auto">

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
                                <span className="max-w-[6rem] truncate"
                                      title={isLoggedIn ? t("navbar.account") : undefined}
                                >
                                    {isLoggedIn ? <Icon name="person" size={20}/> : t("navbar.login")}
                                </span>
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