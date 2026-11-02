import {Link, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses, getMainContainerClasses} from '../styles/AppStyles.jsx';
import Button from '../styles/Button.jsx';
import Icon from '../styles/Icon.jsx';
import {PREVIEWS_BY_ROLE} from './home/HomePreviews.jsx';
import {HOME_COLUMNS} from './home/PreviewLoaders.js';

const GRID_BY_COLUMNS = {
    1: {grid: "grid-cols-1", span: "", width: "max-w-5xl"},
    2: {grid: "grid-cols-1 xl:grid-cols-2", span: "xl:col-span-2", width: "max-w-[100rem]"},
    3: {grid: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3", span: "lg:col-span-2 xl:col-span-3", width: "max-w-[120rem]"},
};

const Home = () => {
    const {dark, user} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const landing = getMainContainerClasses(dark);
    const layout = GRID_BY_COLUMNS[HOME_COLUMNS] ?? GRID_BY_COLUMNS[1];

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

    // region Logged in: the real pages in preview mode, same layout for every role
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const previews = PREVIEWS_BY_ROLE[role] ?? [];

    return (
        <div className={`${classes.page} flex flex-col gap-10`}>
            {/* Welcome sits outside the centered column, so it hugs the left side of the page */}
            <h1 className={`${classes.heading} mb-0! text-left`}>
                {t("home.welcome")} {user?.firstName || ""}
            </h1>

            <div className={`mx-auto grid w-full items-start gap-x-20 gap-y-10 ${layout.width} ${layout.grid}`}>
                {previews.length === 0 && (
                    <p className={`text-center py-8 ${layout.span} ${dark ? "text-slate-400" : "text-gray-500"}`}>
                        {t("home.noPreviews")}
                    </p>
                )}

                {previews.map(({to, titleKey, render}) => (
                    <section key={to} aria-label={t(titleKey)} className="min-w-0">
                        <Button as={Link} to={to} tone="primary" size="lg" dark={dark}
                                className="relative mb-4 w-full px-12 py-3 text-xl font-semibold">
                            {t(titleKey)}
                            <Icon name="arrow_forward" size={24}
                                  className="absolute right-4 transition-transform group-hover:translate-x-1"/>
                        </Button>
                        {render(user)}
                    </section>
                ))}
            </div>
        </div>
    );
    // endregion
};

export default Home;