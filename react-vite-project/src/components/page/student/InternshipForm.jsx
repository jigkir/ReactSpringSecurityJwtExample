import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getHomeClasses, getInternshipCardClasses} from "../../../styles/AppStyles.jsx";

function InternshipForm() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const cardClasses = getInternshipCardClasses(dark);

    return (
        <div>
            This will allow you to see the internship in its entirety, choose the CV to use and then apply to it using that CV
        </div>
    );
}

export default InternshipForm;