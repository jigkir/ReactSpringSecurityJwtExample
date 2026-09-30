import {useTranslation} from 'react-i18next';
import {translateWarning} from '../utils/CommonFields.jsx';

function ErrorPage({error}) {
    const {t} = useTranslation();
    const message = error?.i18n ? translateWarning(t, error.i18n) : error?.message;
    return <p>{message || t("error.unknown")}</p>;
}

export default ErrorPage;