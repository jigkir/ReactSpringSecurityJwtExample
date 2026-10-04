import {useTranslation} from 'react-i18next';
import {getFooterClasses} from '../styles/AppStyles.jsx';

function Footer({dark}) {
    const {t} = useTranslation();
    const classes = getFooterClasses(dark);

    return (
        <footer className={classes.footer}>
            <p className={classes.copyright}>{t("footer.copyright")}</p>
        </footer>
    );
}

export default Footer;