import {Link, useLocation} from 'react-router-dom';
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

function FindNotifications(role, t){
    // TODO: replace the hardcoded count with getPendingCvs().length
    const cvPostedNotificationCount = 1;
    // TODO: replace the hardcoded count with getUpdatedCvs(currentDate).map(status == approved).length
    const cvApprovedNotificationCount = 1;
    // TODO: replace the hardcoded count with getPendingCvs(currentDate).map(status == approved).length
    const cvRefusedNotificationCount = 1;
    switch(role){
        case("MANAGER"):
            return[{
                id: "cvPosted",
                count: cvPostedNotificationCount,
                label: t("navbar.cvPostedNotification", {amount: cvPostedNotificationCount}),
                to: "/manager/cvs", // remove if NotificationMenu doesn't support links
            }]
        case("STUDENT"):
            return[
                {
                    id: "cvAccepte",
                    count: cvApprovedNotificationCount,
                    label: t("navbar.cvApprovedNotification", {amount: cvApprovedNotificationCount}),
                    to: "/manager/cvs", // remove if NotificationMenu doesn't support links
                },
                {
                    id: "cvRefuse",
                    count: cvRefusedNotificationCount,
                    label: t("navbar.cvRefusedNotification", {amount: cvRefusedNotificationCount}),
                    to: "/manager/cvs", // remove if NotificationMenu doesn't support links
                }
            ]
        default:
            return [];
    }
}

function Navbar({user, dark, toggleDark}) {
    const {t, i18n} = useTranslation();
    const location = useLocation();
    const theme = getNavbarClasses(dark);

    const role = normalizeRole(user);
    const isLoggedIn = user?.isLoggedIn ?? false;
    const homePath = isLoggedIn ? "/home" : "/";

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



    const notifications = FindNotifications(role, t);


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
                            {navItems.map(({to, label}) => (
                                <Link key={to} to={to} className={linkClass(to)}
                                      aria-current={isActive(to) ? "page" : undefined}>
                                    {label}
                                </Link>
                            ))}
                            {notifications.length > 0 && (
                                <NotificationMenu notifications={notifications} dark={dark}/>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        {user?.isLoggedIn && (
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

                        <button
                            onClick={toggleLang}
                            className={`${theme.toggleBase} ${theme.toggleBtn}`}
                            aria-label={i18n.language === "en" ? "Passer en français" : "Switch to english"}
                        >
                            {i18n.language === "en" ? t("navbar.switchFench") : t("navbar.switchEnglish")}
                        </button>

                        <button
                            onClick={toggleDark}
                            className={`${theme.toggleBase} ${theme.toggleBtn}`}
                            aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
                        >
                            <Icon name={dark ? "light_mode" : "dark_mode"} size={16}/>
                            {dark ? t("navbar.lightmode") : t("navbar.darkmode")}
                        </button>

                        {user?.isLoggedIn ? (
                            <Link to="/logout" className={linkClass("/logout")}>
                                {t("navbar.disconnect")}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${theme.authBtn}`}
                                >
                                    {t("navbar.login")}
                                </Link>
                                <Link
                                    to="/signup"
                                    className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${theme.signupBtn}`}
                                >
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