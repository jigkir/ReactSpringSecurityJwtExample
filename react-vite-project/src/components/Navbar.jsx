import {createPortal} from "react-dom";
import {Link, NavLink, useLocation, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useEffect, useRef, useState} from 'react';
import {getNavbarClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import NotificationMenu from './NotificationMenu.jsx';
import MobileSidebar from "./page/MobileSideBar.jsx";

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
    const sidebarRef = useRef(null);


    // Close both on route change
    useEffect(() => {
        setMenuOpen(false);
        setAuthMenuOpen(false);
    }, [location.pathname]);

    // Close on outside click / Escape
    useEffect(() => {
        if (!menuOpen && !authMenuOpen) return;
        const onPointerDown = (e) => {
            const clickedInsideSidebar = sidebarRef.current && sidebarRef.current.contains(e.target);
            const clickedMenuBtn = menuRef.current && menuRef.current.contains(e.target);
            if (!clickedMenuBtn && !clickedInsideSidebar) setMenuOpen(false);
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
        `block px-4 py-2 text-lg pl-8 ${
            isActive
                ? (dark ? "bg-slate-700 text-white" : "bg-violet-200 text-indigo-700")
                : (dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100")
        }`;
    const mobileAuthLink = `block px-4 py-2 text-sm ${
        dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100"
    }`;

    const authBtnDesktop = "text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400";

    return (
        <>
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme.header}`}>
            <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    {/* ───────── Left side ───────── */}
                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Desktop brand */}
                        <Link to={homePath}
                              className={`hidden md:flex items-center gap-2 font-bold text-lg tracking-tight shrink-0 transition-colors duration-150 ${theme.brand}`}>
                            <div className="flex items-center font-extrabold text-2xl tracking-tight select-none group cursor-pointer">
                                {/* Always light text for dark-colored navbars */}
                                <span className="text-white transition-colors duration-150">
                                    Intern
                                </span>
                                {/* TLD Badge adapted for dark backgrounds */}
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-2xl font-bold transition-all duration-150 group-hover:scale-105 whitespace-nowrap ${
                                    dark
                                        ? "bg-indigo-500/20 text-indigo-600 border border-indigo-700/30 group-hover:bg-indigo-500/30"
                                        : "bg-indigo-500/10 text-indigo-200 border border-indigo-400/30 group-hover:bg-indigo-500/20"
                                }`}>
                                    . ly
                                </span>
                            </div>
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

                                <Link to={homePath} className="text-2xl leading-none tracking-tight">
                                    <div className="flex items-center font-extrabold text-2xl tracking-tight select-none group cursor-pointer">
                                        {/* Always light text for dark-colored navbars */}
                                        <span className="text-white transition-colors duration-150">
                                            Intern
                                        </span>
                                        {/* TLD Badge adapted for dark backgrounds */}
                                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-2xl font-bold transition-all duration-150 group-hover:scale-105 whitespace-nowrap ${
                                            dark
                                                ? "bg-indigo-500/20 text-indigo-600 border border-indigo-700/30 group-hover:bg-indigo-500/30"
                                                : "bg-indigo-500/10 text-indigo-200 border border-indigo-400/30 group-hover:bg-indigo-500/20"
                                        }`}>
                                            . ly
                                        </span>
                                    </div>
                                </Link>
                            </div>

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
                                <span className="max-w-[6rem] truncate text-md"
                                      title={isLoggedIn ? t("navbar.account") : undefined}
                                >
                                    {isLoggedIn ? <Icon name="person" size={20}/> : t("navbar.getStarted")}
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
        {/* Side Menu Drawer & Backdrop */}
        <MobileSidebar
            ref={sidebarRef}
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            navItems={navItems}
            dark={dark}
            t={t}
            mobileLinkClass={mobileLinkClass}
        />
        </>
    );
}

export default Navbar;