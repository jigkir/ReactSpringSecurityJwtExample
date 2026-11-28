/**
 * Portfolio.jsx — Student portfolio page (route /portfolio).
 * Tabs: All | CV | Cover letters | Transcripts, all rendered by the same <DocumentList />.
 * The page opens on the "All" tab, or on the CV tab when the URL carries a status color
 * (`?status=GREEN`, coming from the Home buttons): the status filter only exists on that tab.
 * One upload panel accepts several PDFs at once (drag & drop or picker), each with its own type.
 * The type of each uploaded file is preselected from the tab being viewed.
 * The "Upload files" button lives in the header of each list card (like before).
 *
 * The "required files" banner shows while the student has no CV at all
 * (it comes back if the last CV is deleted).
 */

import {useCallback, useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getAuthClasses} from "../../../styles/AppStyles.jsx";
import PortfolioContent from "./PortfolioContent.jsx";
import RequiredFilesNotice from "./RequiredFilesNotice.jsx";
import {getCvCount} from "../../shared/core/api/Api.jsx";
import {useColorParam} from "../../../utils/Sort.jsx";
import {ALL} from "../../../utils/StatusColor.js";
import {usePolling} from "../../../utils/usePolling.js";

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
            // Unknown: keep the previous value
        }
    }, []);

    useEffect(() => {
        void checkCv();
    }, [checkCv]);

    // Also catches a CV deleted from the list, so the banner comes back
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