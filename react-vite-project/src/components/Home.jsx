import {Link, Navigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses, getMainContainerClasses} from '../styles/AppStyles.jsx';
import Button from '../styles/Button.jsx';
import Icon from '../styles/Icon.jsx';
import {PREVIEWS_BY_ROLE} from './home/HomePreviews.jsx';
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";

const Home = () => {
    const {dark, user, accountStatus} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const landing = getMainContainerClasses(dark);

    // Token present but user still loading: avoid flashing the landing page
    if (user?.isLoggedIn === undefined && localStorage.getItem("token")) {
        return <div aria-busy="true"/>;
    }

    // region Not logged in: landing page
    if (!user?.isLoggedIn) {
        return (
            <main className={landing.page}>
                <section className={landing.hero}>
                    <h1 className={landing.title}>{t("mainContainer.title")}</h1>
                    <p className={landing.subtitle}>{t("mainContainer.subtitle")}</p>

                    <div className={landing.authActions}>
                        <Link to="/login" className={landing.primaryBtn}>{t("navbar.login")}</Link>
                        <Link to="/signup" className={landing.secondaryBtn}>{t("navbar.signup")}</Link>
                    </div>
                </section>

                <section className={landing.learnMore}>
                    <h2 className={landing.question}>{t("mainContainer.learnMore")}</h2>
                    <Link to="/about" className={landing.secondaryBtn}>{t("navbar.about")}</Link>
                </section>
            </main>
        );
    }

    // endregion

    // region Logged in: wait for the account status, then send an inactive account to /expired
    if (accountStatus === null) return <div aria-busy="true"/>;
    if (accountStatus !== ACCOUNT_STATUS.APPROVED) return <Navigate to="/expired" replace/>;
    // endregion

    // region Logged in: the real pages in preview mode, same layout for every role
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const previews = PREVIEWS_BY_ROLE[role] ?? [];

    return (
        <div className={`${classes.page} flex flex-col gap-10`}>
            {/* Welcome sits outside the centered column, so it hugs the left side of the page */}
            <h1 className={`${classes.heading} mb-0! text-left`}>
                {t("home.welcome")} {user?.firstName || ""}
            </h1>

            {previews.length === 0 ? (
                <p className={`w-full text-center py-8 ${dark ? "text-slate-400" : "text-gray-500"}`}>
                    {t("home.noPreviews")}
                </p>
            ) : (
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
                    {previews.map(({to, titleKey, render}) => (
                        <section key={to} aria-label={t(titleKey)} className="min-w-0 w-full">
                            <Button as={Link} to={to} tone="primary" size="lg" dark={dark}
                                    className="relative mb-4 w-full px-10 py-3 text-base font-semibold whitespace-normal! sm:px-12 sm:text-xl">
                                {t(titleKey)}
                                <Icon name="arrow_forward" size={24}
                                      className="absolute right-4 transition-transform group-hover:translate-x-1"/>
                            </Button>
                            {render(user)}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
    // endregion
};

export default Home;