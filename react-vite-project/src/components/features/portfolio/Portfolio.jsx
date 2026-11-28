


import {useCallback, useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getAuthClasses} from "../../../styles/theme/AppStyles.jsx";
import PortfolioContent from "./PortfolioContent.jsx";
import RequiredFilesNotice from "./RequiredFilesNotice.jsx";
import {getCvCount} from "../../shared/core/api/Api.jsx";
import {useColorParam} from "../../../utils/sorting/Sort.jsx";
import {ALL} from "../../../utils/status/StatusColor.js";
import {usePolling} from "../../../utils/hooks/usePolling.js";

function Portfolio() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {pageClass} = getAuthClasses(dark);
    const statusParam = useColorParam("status");
    const [hasCv, setHasCv] = useState(null);

    const checkCv = useCallback(async () => {
        try {
            setHasCv((await getCvCount()) > 0);
        } catch {

        }
    }, []);

    useEffect(() => {
        void checkCv();
    }, [checkCv]);


    usePolling(checkCv);

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0 flex flex-col gap-4">
                <h1 className={`text-3xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                    {t("portfolio.title")}
                </h1>

                {hasCv === false && <RequiredFilesNotice dark={dark}/>}
                <PortfolioContent
                    dark={dark}
                    initialTab={statusParam === ALL ? "ALL" : "CV"}
                    onChanged={checkCv}
                />
            </div>
        </div>
    );
}

export default Portfolio;
