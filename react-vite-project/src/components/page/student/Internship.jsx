import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses} from '../../../styles/AppStyles.jsx';

function Internship() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);

    return (
        <div className={classes.page}>
            <h1 className={classes.heading}>{t("studentInternship.title")}</h1>
            <p>{t("studentInternship.comingSoon")}</p>
        </div>
    );
}

export default Internship;