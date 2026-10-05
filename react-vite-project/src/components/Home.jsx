import {Link, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses, getMainContainerClasses} from '../styles/AppStyles.jsx';

const Home = () => {
    const {dark, user} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const landing = getMainContainerClasses(dark);

    // Token present but user still loading: avoid flashing the landing page
    if (user?.isLoggedIn === undefined && localStorage.getItem("token")) {
        return <div aria-busy="true"/>;
    }

    // ── Not logged in: landing page (former MainContainer) ────────────────────
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

    // ── Logged in: role home ──────────────────────────────────────────────────
    const role = (user?.role ?? "").toString().replace("ROLE_", "");

    const homeByRole = () => {
        switch (role) {
            case "STUDENT":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleStudent")}</h2>
                    </div>
                );

            case "TEACHER":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleTeacher")}</h2>
                    </div>
                );

            case "EMPLOYER":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleEmployer")}</h2>
                    </div>
                );

            case "MANAGER":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleManager")}</h2>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={classes.page}>
            <h1 className={classes.heading}>
                {t("home.welcome")} {user?.firstName || ""}
            </h1>

            {homeByRole()}
        </div>
    );
};

export default Home;