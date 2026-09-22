import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from 'react-i18next';
import {getFooterClasses} from "../styles/appStyles.jsx";

function Footer() {
    const { t } = useTranslation();
    const classes = getFooterClasses();
    return (
        <footer className={classes.footer}>
            <p>{t("footer.copyright")}</p>
            <Link to='/about'>{t("footer.about")}</Link>
        </footer>
    );
}

export default Footer;