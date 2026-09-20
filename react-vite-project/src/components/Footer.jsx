import React from "react";
import {Link} from "react-router-dom";
import {useTranslation} from 'react-i18next';

function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="text-center flex flex-col mt-auto">
            <p>{t("footer.copyright")}</p>
            <Link to='/about'>{t("footer.about")}</Link>
        </footer>
    );
}

export default Footer;