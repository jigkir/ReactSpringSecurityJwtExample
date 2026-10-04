import {Link, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getMainContainerClasses} from '../styles/AppStyles.jsx';

function MainContainer() {
    const {t} = useTranslation();
    const {dark} = useOutletContext();
    const classes = getMainContainerClasses(dark);

    return (
        <main className={classes.page}>
            <section className={classes.hero}>
                <h1 className={classes.title}>{t("mainContainer.title")}</h1>
                <p className={classes.subtitle}>{t("mainContainer.subtitle")}</p>

                <div className={classes.authActions}>
                    <Link to="/login" className={classes.primaryBtn}>{t("navbar.login")}</Link>
                    <Link to="/signup" className={classes.secondaryBtn}>{t("navbar.signup")}</Link>
                </div>
            </section>

            <section className={classes.learnMore}>
                <h2 className={classes.question}>{t("mainContainer.learnMore")}</h2>
                <Link to="/about" className={classes.secondaryBtn}>{t("navbar.about")}</Link>
            </section>
        </main>
    );
}

export default MainContainer;