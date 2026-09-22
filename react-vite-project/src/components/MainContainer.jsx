import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getMainContainerClasses} from '../styles/appStyles.jsx';

function MainContainer() {
    const {t} = useTranslation();
    const {dark} = useOutletContext();
    const classes = getMainContainerClasses(dark);
    return (
        <div className={classes.page}>
            <h1>{t("mainContainer.title")}</h1>
            <p>{t("mainContainer.subtitle")}</p>
        </div>
    );
}

export default MainContainer;