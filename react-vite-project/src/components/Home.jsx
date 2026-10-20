import {Link, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses, getMainContainerClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import CardPreview from './home/CardPreview.jsx';
import {CARDS_BY_ROLE} from './home/homeCards.js';

const Home = () => {
    const {dark, user} = useOutletContext();
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

    // region Logged in: main feature pages for the role
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const cards = CARDS_BY_ROLE[role] ?? [];

    return (
        <div className={classes.page}>
            <h1 className={classes.heading}>
                {t("home.welcome")} {user?.firstName || ""}
            </h1>

            {cards.length > 0 && (
                <ul className={classes.grid}>
                    {cards.map(({to, icon, titleKey, descKey, load, itemsKey, statOrder}) => (
                        <li key={titleKey}>
                            <Link to={to} className={`${classes.card} h-full`}>
                                <span className={classes.cardIcon}>
                                    <Icon name={icon} size={36} filled/>
                                </span>
                                <h2 className={classes.cardTitle}>{t(titleKey)}</h2>
                                <p className={classes.cardDesc}>{t(descKey)}</p>

                                {load && (
                                    <CardPreview load={load} itemsKey={itemsKey} statOrder={statOrder}
                                                 classes={classes}/>
                                )}

                                <span className={classes.cardLink}>
                                    {t("home.preview.viewAll")}
                                    <Icon name="arrow_back" size={16} className="rotate-180"/>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
    // endregion
};

export default Home;