import {useTranslation} from "react-i18next";
import {useOutletContext} from "react-router-dom";
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";

function StudentStatuses() {
    const {t} = useTranslation();
    const {dark} = useOutletContext();
    const s = getPostInternshipClasses(dark);

    return (
        <div className={s.page}>
            <div className={s.listSection}>
                <h1 className="text-2xl font-bold">
                    {t("studentStatuses.title")}
                </h1>
            </div>
        </div>
    );
}

export default StudentStatuses;