import {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses} from '../styles/appStyles.jsx';
import NotificationMenu from './NotificationMenu.jsx';

function Navbar({user, dark, toggleDark}) {
    const {t, i18n} = useTranslation();
    const location = useLocation();

    // State for mobile dropdown menus
    const [menuOpen, setMenuOpen] = useState(false);
    const [authMenuOpen, setAuthMenuOpen] = useState(false);

    const role = (user?.role?.toString() ?? "").replace("ROLE_", "");
    const toggleLang = () => {
        if (i18n.language === "en") {
            i18n.changeLanguage("fr");
        } else {
            i18n.changeLanguage("en");
        }
    };

    const formatRole = (roleString) => {
        if (!roleString) return "";
        const name = roleString.replace("ROLE_", "").toLowerCase();
        const key = `navbar.${name}`;
        const translated = t(key);
        return translated !== key ? translated : name.charAt(0).toUpperCase() + name.slice(1);
    };

    const isActive = (path) =>
        path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);

    const homePath = user?.isLoggedIn ? "/home" : "/";
    const theme = getNavbarClasses(dark);

    const linkClass = (path) =>
        `${theme.linkBase} ${isActive(path) ? theme.linkActive : theme.linkIdle}`;

    const navItems = [
        {to: homePath, label: t("navbar.accueil"), show: true},
        {to: "/about", label: t("navbar.about"), show: true},
        {to: "/cv", label: "CV", show: role === "STUDENT"},
        {to: "/post", label: t("navbar.postInternship"), show: role === "EMPLOYER"},
    ].filter(item => item.show);

    const ToggleIcon = () => dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9H21M3 12H2m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        </svg>
    );

    const cvNotificationCount = 0;
    const notifications = (role === "MANAGER"
        ? [{ id: "cv", count: cvNotificationCount, label: t("navbar.cvNotification", {amount: cvNotificationCount}) }]
        : []);

    return (
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme.header}`}>
            <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    <div className="flex items-center gap-3">
                        {/* Desktop brand name (hidden on mobile) */}
                        <h1 className={`hidden md:flex items-center font-bold text-base md:text-lg tracking-tight shrink-0 transition-colors duration-150 ${theme.brand}`}>
                            {t("navbar.appName")}
                        </h1>

                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map(({to, label}) => (
                                <Link key={to} to={to} className={linkClass(to)} aria-current={isActive(to) ? "page" : undefined}>
                                    {label}
                                </Link>
                            ))}
                            {notifications.length > 0 && <NotificationMenu notifications={notifications} dark={dark}/>}
                        </nav>

                        {/* Mobile dropdown button styled as the app name */}
                        <div className="relative md:hidden">
                            <button
                                onClick={() => { setMenuOpen(!menuOpen); setAuthMenuOpen(false); }}
                                className={`p-1 -ml-1 rounded-lg font-bold text-base tracking-tight flex items-center gap-1.5 ${theme.brand}`}
                                aria-label="Toggle pages menu"
                            >
                                <span>{t("navbar.appName")}</span>
                                <svg className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {menuOpen && (
                                <div className={`absolute left-0 mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                                    {navItems.map(({to, label}) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            onClick={() => setMenuOpen(false)}
                                            className={`block px-4 py-2 text-sm ${isActive(to) ? (dark ? "bg-slate-700 text-white" : "bg-indigo-50 text-indigo-700") : (dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100")}`}
                                        >
                                            {label}
                                        </Link>
                                    ))}
                                    {notifications.length > 0 && (
                                        <div className="px-4 py-2">
                                            <NotificationMenu notifications={notifications} dark={dark}/>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={toggleLang} className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1`}>
                            {i18n.language === "en" ? t("navbar.switchFench") : t("navbar.switchEnglish")}
                        </button>
                        <button onClick={toggleDark} className={`${theme.toggleBase} ${theme.toggleBtn} text-xs px-2 py-1`}>
                            <ToggleIcon/>
                        </button>

                        <div className="hidden md:flex items-center gap-2 ml-2">
                            {user?.isLoggedIn && (
                                <div className={`flex items-center gap-2 text-sm ${theme.greeting}`}>
                                    <span>{t("navbar.hello")}</span>
                                    <span className={`font-semibold ${theme.greetingName}`}>{user.firstName}</span>
                                    {role && <span className={`text-xs px-2 py-0.5 rounded-full ${theme.badge}`}>{formatRole(role)}</span>}
                                </div>
                            )}
                            {user?.isLoggedIn ? (
                                <Link to="/logout" className={linkClass("/logout")}>{t("navbar.disconnect")}</Link>
                            ) : (
                                <>
                                    <Link to="/login" className={`text-sm font-semibold px-3 py-1.5 rounded-full ${theme.authBtn}`}>{t("navbar.login")}</Link>
                                    <Link to="/signup" className={`text-sm font-semibold px-3 py-1.5 rounded-full ${theme.signupBtn}`}>{t("navbar.signup")}</Link>
                                </>
                            )}
                        </div>

                        <div className="relative md:hidden ml-1">
                            <button
                                onClick={() => { setAuthMenuOpen(!authMenuOpen); setMenuOpen(false); }}
                                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 ${theme.authBtn}`}
                                aria-label="Toggle account menu"
                            >
                                <span>{user?.isLoggedIn ? (user.firstName || "Compte") : "Connexion"}</span>
                                <svg className={`h-4 w-4 transition-transform ${authMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {authMenuOpen && (
                                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                                    {user?.isLoggedIn ? (
                                        <>
                                            <div className={`px-4 py-2 text-xs border-b ${dark ? "border-slate-700 text-slate-400" : "border-gray-100 text-gray-500"}`}>
                                                {user.firstName} {user.lastName} ({formatRole(role)})
                                            </div>
                                            <Link
                                                to="/logout"
                                                onClick={() => setAuthMenuOpen(false)}
                                                className={`block px-4 py-2 text-sm text-red-500 hover:bg-red-500/10`}
                                            >
                                                {t("navbar.disconnect")}
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                onClick={() => setAuthMenuOpen(false)}
                                                className={`block px-4 py-2 text-sm ${dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100"}`}
                                            >
                                                {t("navbar.login")}
                                            </Link>
                                            <Link
                                                to="/signup"
                                                onClick={() => setAuthMenuOpen(false)}
                                                className={`block px-4 py-2 text-sm ${dark ? "text-slate-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-gray-100"}`}
                                            >
                                                {t("navbar.signup")}
                                            </Link>
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