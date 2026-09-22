import {Link, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getAboutClasses} from "../styles/appStyles.jsx";

function About() {
    const {t} = useTranslation();
    const {dark, user} = useOutletContext();
    const homePath = user?.isLoggedIn ? '/home' : '/';
    const classes = getAboutClasses(dark);
    return (
        <div className={classes.page}>
            <h4>{t("about.version")}</h4>
            <Link to={homePath}>{t("about.backLabel")}</Link>
        </div>
    );
}

export default About;
