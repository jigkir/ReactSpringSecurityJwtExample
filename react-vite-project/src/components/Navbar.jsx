import {Link, NavLink, useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useEffect, useRef, useState} from 'react';
import {getNavbarClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import MobileSidebar from "./page/MobileSideBar.jsx";
import NotificationMenu from './notification/NotificationMenu.jsx';
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import SessionSelect from "./session/SessionSelect.jsx";
import {useSession} from "../utils/useSession.js";
import {useAdaptiveNavbar} from "../utils/useAdaptiveNavbar.js";

// Links by role. Every label is a translation key (`labelKey`).
const link = (to, labelKey) => ({to, labelKey});

const NAV_BY_ROLE = {
    STUDENT: [
        link("/portfolio", "navbar.portfolio"),
        link("/internship", "navbar.internships"),
        link("/interviews", "navbar.interviews"),
        link("/offers", "navbar.offers"),
    ],
    MANAGER: [
        link("/manager/cvs", "navbar.cv"),
        link("/manager/internships", "navbar.internships"),
        link("/manager/contracts", "navbar.contracts"),
        link("/users", "navbar.users"),
    ],
    EMPLOYER: [
        link("/internships", "navbar.postInternship"),
        link("/applications", "navbar.applications"),
        link("/employer/interviews", "navbar.interviews"),
    ],
    TEACHER: [],
};

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

function Navbar({user, accountStatus, dark, toggleDark}) {
    const {t, i18n} = useTranslation();
    const location = useLocation();
    const theme = getNavbarClasses(dark);
    const {sessions, selectedSession} = useSession();

    // Mobile dropdowns
    const [menuOpen, setMenuOpen] = useState(false);
    const [authMenuOpen, setAuthMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const authRef = useRef(null);
    const sidebarRef = useRef(null);
    const rowRef = useRef(null);

    const role = normalizeRole(user);
    const isLoggedIn = user?.isLoggedIn ?? false;
    const homePath = isLoggedIn ? "/home" : "/";
    const isAccessGranted = accountStatus === ACCOUNT_STATUS.APPROVED;
    const isEn = (i18n.resolvedLanguage ?? i18n.language ?? "fr").startsWith("en");
    const toggleLang = () => i18n.changeLanguage(isEn ? "fr" : "en");

    // Everything that can change the width of the content: when it changes, the fit is measured again
    const signature = [
        i18n.resolvedLanguage, dark, isLoggedIn, isAccessGranted, role,
        user?.firstName, user?.lastName,
        sessions.map((s) => s.name).join(","), selectedSession?.name,
    ].join("|");

    // 0 = everything, 1 = icon-only buttons, 2 = account in a dropdown, 3 = burger menu
    const level = useAdaptiveNavbar(rowRef, signature);
    const compact = level >= 1;
    const accountCollapsed = level >= 2;
    const burger = level >= 3;

    // Close both on route change
    useEffect(() => {
        setMenuOpen(false);
        setAuthMenuOpen(false);
    }, [location.pathname]);

    // The sidebar only exists in burger mode
    useEffect(() => {
        if (!burger) setMenuOpen(false);
    }, [burger]);

    useEffect(() => {
        if (!accountCollapsed) setAuthMenuOpen(false);
    }, [accountCollapsed]);

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

    const formatRole = (r) => {
        if (!r) return "";
        const name = r.toLowerCase();
        const key = `navbar.${name}`;
        const translated = t(key);
        return translated !== key ? translated : name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Order: Home, role links, then About always last (right before the notification bell)
    const navItems = [
        {to: homePath, label: t("navbar.accueil"), end: true},
        ...(isLoggedIn && isAccessGranted ? (NAV_BY_ROLE[role] ?? []) : []).map((item) => ({
            ...item, label: item.labelKey ? t(item.labelKey) : item.label,
        })),
        {to: "/about", label: t("navbar.about")},
    ];

    const linkClass = ({isActive}) => `${theme.linkBase} ${isActive ? theme.linkActive : theme.linkIdle}`;

    // Mobile dropdown styling
    const dropdownPanel = `absolute mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`;
    const mobileLinkClass = ({isActive}) => `block px-4 py-2 text-lg pl-8 ${isActive ? (dark ? "bg-slate-700 text-white" : "bg-violet-200 text-indigo-700") : (dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100")}`;

    const authBtnDesktop = "text-sm font-semibold px-3.5 py-1.5 rounded-full transition duration-200 active:scale-95 motion-reduce:active:scale-100 shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400";

    const tldBadge = `ml-1 px-1.5 py-0.5 rounded-md font-bold transition-all duration-150 group-hover:scale-105 whitespace-nowrap ${dark ? "bg-indigo-500/20 text-indigo-600 border border-indigo-700/30 group-hover:bg-indigo-500/30" : "bg-indigo-500/10 text-indigo-200 border border-indigo-400/30 group-hover:bg-indigo-500/20"}`;

    return (<>
        <header className={`sticky top-0 z-50 w-full max-w-full transition-colors duration-300 ${theme.header}`}>
            <div className="w-full max-w-full mx-auto px-2 sm:px-6 xl:px-8">
                <div ref={rowRef} className="flex items-center justify-between h-14 w-full max-w-full">

                    {/* ───────── Left side ───────── */}
                    <div className="flex items-center gap-1 min-[380px]:gap-1.5 sm:gap-3 shrink-0 justify-start">
                        {/* Desktop brand */}
                        {!burger && (
                            <Link to={homePath}
                                  className={`flex items-center gap-2 font-bold text-lg tracking-tight shrink-0 transition-colors duration-150 ${theme.brand}`}>
                                <div
                                    className="flex items-center font-extrabold text-2xl tracking-tight select-none group cursor-pointer">
                                    <span className="text-white transition-colors duration-150">Intern</span>
                                    <span className={`${tldBadge} text-2xl`}>.ly</span>
                                </div>
                            </Link>
                        )}

                        {/* Desktop nav (bell always visible) */}
                        {!burger && (
                            <nav className="flex items-center gap-1">
                                {navItems.map(({to, label, end}) => (
                                    <NavLink key={to} to={to} end={end} className={linkClass}>
                                        {label}
                                    </NavLink>))}
                                {isLoggedIn && isAccessGranted && <NotificationMenu dark={dark}/>}
                            </nav>
                        )}

                        {/* Burger mode: app name doubles as the pages dropdown button */}
                        {burger && (
                            <div ref={menuRef}>
                                <div
                                    className={`p-1.5 -ml-1.5 rounded-lg font-bold flex items-center gap-1 sm:gap-2 ${theme.brand}`}>
                                    <button
                                        onClick={() => {
                                            setMenuOpen((o) => !o);
                                            setAuthMenuOpen(false);
                                        }}
                                        className="flex items-center justify-center transition duration-200 active:scale-95 motion-reduce:active:scale-100"
                                        aria-label={t("navbar.pagesMenu")}
                                        aria-expanded={menuOpen}
                                    >
                                        <Icon name="menu" size={24}/>
                                    </button>

                                    <Link to={homePath}
                                          className="text-lg min-[380px]:text-xl sm:text-2xl leading-none tracking-tight">
                                        <div
                                            className="flex items-center font-extrabold text-lg min-[380px]:text-xl sm:text-2xl tracking-tight select-none group cursor-pointer">
                                            <span className="text-white transition-colors duration-150">Intern</span>
                                            <span
                                                className={`${tldBadge} px-1 sm:px-1.5 text-lg min-[380px]:text-xl sm:text-2xl`}>
                                                .ly
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Burger mode: bell in the top bar */}
                        {burger && isLoggedIn && isAccessGranted && <NotificationMenu dark={dark}/>}
                    </div>

                    {/* ───────── Center: the session selector takes the leftover space ───────── */}
                    {isLoggedIn && isAccessGranted ? (
                        <div className="hidden sm:flex grow shrink-0 justify-center px-2">
                            <SessionSelect
                                className={`px-3 py-1 rounded-lg text-sm border text-white ${dark ? "bg-slate-800 border-slate-700" : "border-gray-300 [&>option]:text-gray-900"}`}
                                errorClassName="text-sm text-red-300"
                            />
                        </div>
                    ) : <div className="grow"/>}

                    {/* ───────── Right side ───────── */}
                    <div className="flex items-center gap-1 min-[380px]:gap-1.5 sm:gap-2 shrink-0 justify-end">
                        <button onClick={toggleLang}
                                className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1`}
                                aria-label={isEn ? t("navbar.switchToFrench") : t("navbar.switchToEnglish")}>
                            <Icon name="language" size={16}/>
                            {/* Icon only on very narrow screens (320px) */}
                            <span className="max-[379px]:hidden">
                                {isEn ? t("navbar.switchFench") : t("navbar.switchEnglish")}
                            </span>
                        </button>

                        <button onClick={toggleDark}
                                className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1`}
                                aria-label={dark ? t("navbar.switchToLight") : t("navbar.switchToDark")}>
                            <Icon name={dark ? "light_mode" : "dark_mode"} size={16}/>
                            {!compact && <span>{dark ? t("navbar.lightmode") : t("navbar.darkmode")}</span>}
                        </button>

                        {/* Full account area: greeting + auth + logout */}
                        {!accountCollapsed && (
                            <div className="flex items-center gap-3 ml-2">
                                {isLoggedIn && (
                                    <div
                                        className={`flex items-center gap-2 text-sm whitespace-nowrap ${theme.greeting}`}>
                                        {!compact && (
                                            <span className="inline-flex" role="img" aria-label={t("navbar.hello")}>
                                                <Icon name="waving_hand" size={20}/>
                                            </span>
                                        )}
                                        <span className={`font-semibold ${theme.greetingName}`}>
                                            {user.firstName} {user.lastName}
                                        </span>
                                        {role && !compact && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${theme.badge}`}>
                                                {formatRole(role)}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {!isLoggedIn && (<>
                                    <Link to="/login" className={`${authBtnDesktop} ${theme.authBtn}`}>
                                        {t("navbar.login")}
                                    </Link>
                                    <Link to="/signup" className={`${authBtnDesktop} ${theme.signupBtn}`}>
                                        {t("navbar.signup")}
                                    </Link>
                                </>)}

                                {isLoggedIn && (
                                    <Link to="/logout"
                                          className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1 ${dark ? "text-red-400!" : "text-red-300!"}`}
                                          aria-label={t("navbar.disconnect")}
                                          title={t("navbar.disconnect")}>
                                        <Icon name="logout" size={16}/>
                                        {!compact && <span>{t("navbar.disconnect")}</span>}
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Collapsed account: person icon (name + role, then logout, in a dropdown) */}
                        {accountCollapsed && (
                            <div ref={authRef} className="relative">
                                {isLoggedIn ? (<button
                                    type="button"
                                    onClick={() => {
                                        setAuthMenuOpen((o) => !o);
                                        setMenuOpen(false);
                                    }}
                                    className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition duration-200 active:scale-95 motion-reduce:active:scale-100 shadow-md hover:shadow-lg ${theme.authBtn}`}
                                    aria-label={t("navbar.accountMenu")}
                                    aria-expanded={authMenuOpen}
                                >
                                    <span className="max-w-24 truncate text-md" title={t("navbar.account")}>
                                        <Icon name="person" size={20}/>
                                    </span>
                                </button>) : (<Link
                                    to="/login"
                                    className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition duration-200 active:scale-95 motion-reduce:active:scale-100 shadow-md hover:shadow-lg ${theme.authBtn}`}
                                    aria-label={t("navbar.login")}
                                >
                                    <Icon name="person" size={20} className="min-[420px]:hidden"/>
                                    <span className="hidden min-[420px]:inline max-w-24 truncate text-md">
                                        {t("navbar.login")}
                                    </span>
                                </Link>)}

                                {authMenuOpen && isLoggedIn && (<div className={`${dropdownPanel} right-0`}>
                                    <div
                                        className={`px-4 py-2 mb-1 border-b ${dark ? "border-slate-600" : "border-gray-200"}`}>
                                        <p className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-gray-900"}`}>
                                            {user.firstName} {user.lastName}
                                        </p>
                                        {role && (
                                            <p className={`text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}>
                                                {formatRole(role)}
                                            </p>
                                        )}
                                    </div>
                                    <Link to="/logout"
                                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${dark ? "text-red-400 hover:bg-slate-700/50" : "text-red-600 hover:bg-red-50"}`}>
                                        <Icon name="logout" size={16}/>
                                        {t("navbar.disconnect")}
                                    </Link>
                                </div>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>

        {/* Side Menu Drawer & Backdrop (burger mode only) */}
        {burger && (
            <MobileSidebar
                ref={sidebarRef}
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                navItems={navItems}
                dark={dark}
                t={t}
                mobileLinkClass={mobileLinkClass}
                isLoggedIn={isLoggedIn}
                isAccessGranted={isAccessGranted}
            />
        )}
    </>);
}

export default Navbar;