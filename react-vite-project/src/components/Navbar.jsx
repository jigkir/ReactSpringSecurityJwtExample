import {Link, useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getNavbarClasses} from '../styles/appStyles.jsx';
import Icon from '../styles/Icon.jsx';
import NotificationMenu from './NotificationMenu.jsx';

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

    const role = (user?.role?.toString() ?? "").replace("ROLE_", "");
    const toggleLang = () => {
        if (i18n.language === "en") {
            i18n.changeLanguage("fr")
        } else {
            i18n.changeLanguage("en")
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
        {to: "/manager/cvs", label: t("navbar.cvReview", "CVs à valider"), show: role === "MANAGER"},
        {to: "/post", label: t("navbar.postInternship"), show: role === "EMPLOYER"},
    ].filter(item => item.show);

    const ToggleIcon = () => <Icon name={dark ? "light_mode" : "dark_mode"} size={16}/>;



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
                            <ToggleIcon/>
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