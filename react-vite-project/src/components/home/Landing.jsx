import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getMainContainerClasses, REVEAL_FROM} from '../../styles/AppStyles.jsx';
import Icon from '../../styles/Icon.jsx';
import Reveal from '../../styles/Reveal.jsx';

const WAVE_PATH = "M0,0 H1440 V40 C1200,80 960,80 720,48 C480,16 240,16 0,48 Z";

// Home page of a visitor who is not logged in
function Landing({dark}) {
    const {t} = useTranslation();
    const classes = getMainContainerClasses(dark);

    return (
        <main className={classes.page}>
            <section className={classes.hero}>
                <Reveal from={REVEAL_FROM.UP}>
                    <h1 className={classes.title}>{t("mainContainer.title")}</h1>
                </Reveal>
                <Reveal from={REVEAL_FROM.UP} className={classes.subtitleReveal}>
                    <p className={classes.subtitle}>{t("mainContainer.subtitle")}</p>
                </Reveal>
                <Reveal from={REVEAL_FROM.UP} className={classes.authActions}>
                    <Link to="/login" className={classes.primaryBtn}>{t("navbar.login")}</Link>
                    <Link to="/signup" className={classes.secondaryBtn}>{t("navbar.signup")}</Link>
                </Reveal>
            </section>

            <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className={classes.wave}>
                <path d={WAVE_PATH}/>
            </svg>

            <Reveal from={REVEAL_FROM.UP} className={classes.learnMore}>
                <h2 className={classes.question}>{t("mainContainer.learnMore")}</h2>
                <Link to="/about" className={classes.secondaryBtn}>
                    {t("navbar.about")}
                    <Icon name="arrow_forward" size={20}/>
                </Link>
            </Reveal>
        </main>
    );
}

export default Landing;