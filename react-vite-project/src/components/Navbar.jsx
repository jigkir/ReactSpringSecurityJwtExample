import {Link, useLocation} from "react-router-dom";
import {useTranslation} from 'react-i18next';

function Navbar({user, dark, toggleDark}) {
    const { t, i18n} = useTranslation();
    const location = useLocation();

    const role = (user?.role?.toString() ?? '').replace('ROLE_', '');
    const toggleLang = () => {if (i18n.language === 'en') {i18n.changeLanguage('fr')}else {i18n.changeLanguage('en')}};
    const formatRole = (roleString) => {
        if (!roleString) return '';
        const name = roleString.replace('ROLE_', '');
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    const isActive = (path) =>
        path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

    const homePath = user?.isLoggedIn ? '/home' : '/';

    const theme = {
        header: dark ? 'bg-slate-800/95 backdrop-blur border-b border-slate-700 shadow-md shadow-black/20'
            : 'bg-indigo-600 border-b border-indigo-700 shadow-md',
        brand: dark ? 'text-white hover:text-indigo-300' : 'text-white hover:text-indigo-100',
        linkActive: dark ? 'bg-slate-700 text-white' : 'bg-white/15 text-white',
        linkIdle: dark ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-indigo-100 hover:text-white hover:bg-white/10',
        authBtn: dark ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-white text-indigo-700 hover:bg-indigo-50',
        greeting: dark ? 'text-slate-400' : 'text-indigo-100',
        greetingName: dark ? 'text-white' : 'text-white',
        badge: dark ? 'bg-slate-700 text-slate-200 ring-1 ring-slate-600' : 'bg-white/15 text-white ring-1 ring-white/25',
        toggleBtn: dark ? 'bg-slate-700 hover:bg-slate-600 text-amber-300' : 'bg-white/15 hover:bg-white/25 text-white',
    };

    const linkClass = (path) =>
        `text-sm font-medium px-3 py-1.5 rounded-full transition-colors duration-150
        ${isActive(path) ? theme.linkActive : theme.linkIdle}`;

    const navItems = [
        {to: homePath, label: t("navbar.accueil"), show: true},
        {to: '/about', label: t("navbar.about"), show: true},
        {to: '/cv', label: 'CV', show: role === 'STUDENT'},
        {to: '/post', label: 'Post Internship', show: role === 'EMPLOYER'},
    ].filter(item => item.show);

    const ToggleIcon = () => dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
             stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 3v1m0 16v1m8.66-9H21M3 12H2m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
             stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        </svg>
    );

    return (
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme.header}`}>
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    <div className="flex items-center gap-6">
                        <Link to="/"
                              className={`flex items-center gap-2 font-bold text-lg tracking-tight transition-colors duration-150 ${theme.brand}`}>
                            {t("navbar.appName")}
                        </Link>
                        <nav className="flex items-center gap-1">
                            {navItems.map(({to, label}) => (
                                <Link key={to} to={to} className={linkClass(to)}
                                      aria-current={isActive(to) ? 'page' : undefined}>
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        {user?.isLoggedIn && (
                            <div className={`flex items-center gap-2 text-sm ${theme.greeting}`}>
                                <span>Bonjour,</span>
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
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${theme.toggleBtn}`}
                            aria-label={i18n.language === 'en' ? 'Passer en français' : 'Switch to english'}
                        >
                            {i18n.language === 'en' ? t("navbar.switchFench") : t("navbar.switchEnglish")}
                        </button>

                        <button
                            onClick={toggleDark}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${theme.toggleBtn}`}
                            aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
                        >
                            <ToggleIcon/>
                            {dark ? t("navbar.lightmode") : t("navbar.darkmode")}
                        </button>

                        {user?.isLoggedIn ? (
                            <Link to="/logout" className={linkClass('/logout')}>
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
                                    className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 ${
                                        dark
                                            ? 'bg-transparent border border-indigo-400 text-indigo-300 hover:bg-indigo-500/20'
                                            : 'bg-transparent border border-white text-white hover:bg-white/15'
                                    }`}
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