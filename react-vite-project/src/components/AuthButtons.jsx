import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Icon from "../styles/Icon.jsx";
import {getMainContainerClasses, getNavbarClasses} from "../styles/AppStyles.jsx";
import {PATHS} from "../routes/AppRoutes.jsx";

/**
 * AuthButtons.jsx: the "Log in" and "Sign up" buttons, shared by the Navbar and the Landing page.
 * Label, icon, route and aria-label are defined ONCE here; only the look changes per variant.
 *
 * Props
 *   variant  "navbar" | "hero"   which surface the buttons sit on
 *   dark     boolean
 *   compact  boolean             navbar only: icon-only buttons
 */

const getAuthLinks = () => [
    {to: PATHS.LOGIN, labelKey: "navbar.login", icon: "login", role: "login"},
    {to: PATHS.SIGNUP, labelKey: "navbar.signup", icon: "person_add", role: "signup"},
];

const NAVBAR_BTN = "inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full transition duration-200 active:scale-95 motion-reduce:active:scale-100 shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400";

function AuthButtons({variant = "navbar", dark, compact = false}) {
    const {t} = useTranslation();
    const navbar = getNavbarClasses(dark);
    const hero = getMainContainerClasses(dark);

    const isNavbar = variant === "navbar";

    const classOf = (role) => {
        if (isNavbar) return `${NAVBAR_BTN} ${role === "login" ? navbar.authBtn : navbar.signupBtn}`;
        return role === "login" ? hero.primaryBtn : hero.secondaryBtn;
    };

    return (
        <>
            {getAuthLinks().map(({to, labelKey, icon, role}) => (
                <Link key={to} to={to} className={classOf(role)}
                      aria-label={t(labelKey)} title={t(labelKey)}>
                    <Icon name={icon} size={isNavbar ? 16 : 20}/>
                    {!(isNavbar && compact) && <span>{t(labelKey)}</span>}
                </Link>
            ))}
        </>
    );
}

export default AuthButtons;