import {Link, NavLink, useLocation} from 'react-router-dom';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses} from '../styles/appStyles.jsx';
import Icon from '../styles/Icon.jsx';
import NotificationMenu from './NotificationMenu.jsx';

// Links by role. `end` = only active on the exact path (needed for "/" and "/home").
const NAV_BY_ROLE = {
    STUDENT: [{to: "/cv", label: "CV"}],
    MANAGER: [{to: "/manager/cvs", label: "CV"}],
    EMPLOYER: [{to: "/post", labelKey: "navbar.postInternship"}],
    TEACHER: [],
};

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

function Navbar({user, dark, toggleDark}) {
    const {t, i18n} = useTranslation();
    const location = useLocation();
    const theme = getNavbarClasses(dark);

    const role = normalizeRole(user);
    const isLoggedIn = user?.isLoggedIn ?? false;
    const homePath = isLoggedIn ? "/home" : "/";

    // State for mobile dropdown menus
    const [menuOpen, setMenuOpen] = useState(false);
    const [authMenuOpen, setAuthMenuOpen] = useState(false);

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
    const toggleLang = () => i18n.changeLanguage(i18n.language === "en" ? "fr" : "en");

    const formatRole = (r) => {
        if (!r) return "";
        const name = r.toLowerCase();
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
        {to: homePath, label: t("navbar.accueil"), end: true},
        {to: "/about", label: t("navbar.about")},
        ...(isLoggedIn ? (NAV_BY_ROLE[role] ?? []) : []).map((item) => ({
            ...item,
            label: item.labelKey ? t(item.labelKey) : item.label,
        })),
    ];

    const linkClass = ({isActive}) =>
        `${theme.linkBase} ${isActive ? theme.linkActive : theme.linkIdle}`;

    // TODO: replace the hardcoded count with getPendingCvs().length
    const cvNotificationCount = 0;
    const notifications = role === "MANAGER"
        ? [{
            id: "cv",
            count: cvNotificationCount,
            label: t("navbar.cvNotification", {amount: cvNotificationCount}),
            to: "/manager/cvs",
        }]
        : [];

    return (
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme.header}`}>
            <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    <div className="flex items-center gap-3">
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

                    <div className="flex items-center gap-3 ml-auto">
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

                        <button onClick={toggleLang} className={`${theme.toggleBase} ${theme.toggleBtn}`}
                                aria-label={i18n.language === "en" ? "Passer en français" : "Switch to english"}>
                            {i18n.language === "en" ? t("navbar.switchFench") : t("navbar.switchEnglish")}
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