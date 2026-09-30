import {Link, NavLink, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses} from '../styles/appStyles.jsx';
import Icon from '../styles/Icon.jsx';
import NotificationMenu from './NotificationMenu.jsx';
import {getManagerNotifications} from "./api/Api.jsx";
import {useEffect, useState} from "react";


// Links by role. `end` = only active on the exact path (needed for "/" and "/home").
const NAV_BY_ROLE = {
    STUDENT: [{to: "/cv", label: "CV"}],
    MANAGER: [{to: "/manager/cvs", label: "CV"}],
    EMPLOYER: [{to: "/post", labelKey: "navbar.postInternship"}],
    TEACHER: [],
};

const normalizeRole = (user) => (user?.role?.toString() ?? "").replace("ROLE_", "");

function FindNotifications(role, t, user) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (role !== "MANAGER" || !user?.id) return;
        let cancelled = false;

        getManagerNotifications(user.id)
            .then((data) => {
                if (!cancelled) setCount(Array.isArray(data) ? data.length : 0);
            })
            .catch((err) => {
                // Don't redirect the whole app to /error just because the bell failed
                setCount(0);
                console.error("Notifications failed:", err.status, err.body);
            });
        return () => { cancelled = true; };
    }, [role, user?.id]);

    return count > 0
        ? [{
            id: "cvPosted",
            count,
            label: t("navbar.cvNotification", {amount: count}),
            to: "/manager/cvs",
        }]
        : [];
}

function Navbar({user, dark, toggleDark}) {
    const {t, i18n} = useTranslation();
    const theme = getNavbarClasses(dark);

    const role = normalizeRole(user);
    const isLoggedIn = user?.isLoggedIn ?? false;
    const homePath = isLoggedIn ? "/home" : "/";

    const isEn = (i18n.resolvedLanguage ?? i18n.language ?? "fr").startsWith("en");
    const toggleLang = () => i18n.changeLanguage(isEn ? "fr" : "en");



    const notifications = FindNotifications(role, t, user);

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




    return (
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme.header}`}>
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    <div className="flex items-center gap-6">
                        <Link to={homePath}
                              className={`flex items-center gap-2 font-bold text-lg tracking-tight transition-colors duration-150 ${theme.brand}`}>
                            {t("navbar.appName")}
                        </Link>
                        <nav className="flex items-center gap-1">
                            {navItems.map(({to, label, end}) => (
                                <NavLink key={to} to={to} end={end} className={linkClass}>
                                    {label}
                                </NavLink>
                            ))}
                            {
                                <NotificationMenu notifications={notifications} dark={dark}/>
                            }
                        </nav>
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
                                aria-label={isEn ? t("navbar.switchToFrench") : t("navbar.switchToEnglish")}>
                            {isEn ? t("navbar.switchFench") : t("navbar.switchEnglish")}
                        </button>

                        <button onClick={toggleDark} className={`${theme.toggleBase} ${theme.toggleBtn}`}
                                aria-label={dark ? t("navbar.switchToLight") : t("navbar.switchToDark")}>
                            <Icon name={dark ? "light_mode" : "dark_mode"} size={16}/>
                            {dark ? t("navbar.lightmode") : t("navbar.darkmode")}
                        </button>

                        {isLoggedIn ? (
                            <NavLink to="/logout" className={linkClass}>{t("navbar.disconnect")}</NavLink>
                        ) : (
                            <>
                                <Link to="/login"
                                      className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${theme.authBtn}`}>
                                    {t("navbar.login")}
                                </Link>
                                <Link to="/signup"
                                      className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${theme.signupBtn}`}>
                                    {t("navbar.signup")}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;