/**
 * Portfolio.jsx — Student portfolio page (route /portfolio).
 * Tabs: All | CV | Cover letters | Transcripts, all rendered by the same <DocumentList />.
 * The page opens on the "All" tab.
 * One upload panel accepts several PDFs at once (drag & drop or picker), each with its own type.
 * The "Upload files" button lives in the header of each list card (like before).
 *
 * The "required files" banner shows while the student has no CV at all
 * (it comes back if the last CV is deleted).
 */

import {useCallback, useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import {getAuthClasses} from '../../../styles/AppStyles.jsx';
import DocumentList from './DocumentList.jsx';
import PortfolioUpload from './PortfolioUpload.jsx';
import RequiredFilesNotice from './RequiredFilesNotice.jsx';
import {getCvCount, getMaxCvSize} from '../../api/Api.jsx';
import {FALLBACK_MAX_BYTES} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {usePolling} from '../../../utils/usePolling.js';

const TABS = ["ALL", ...DOC_TYPE_KEYS];

export default function Portfolio() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {pageClass} = getAuthClasses(dark);
    const [tab, setTab] = useState("ALL");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);
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
    }, [checkCv, reloadToken]);

    // Also catches a CV deleted from the list, so the banner comes back
    usePolling(checkCv);

    useEffect(() => {
        getMaxCvSize().then(setMaxBytes).catch(() => {
        });
    }, []);

    const reloadLists = () => setReloadToken((v) => v + 1);
    const tabLabel = (k) => t(k === "ALL" ? "portfolio.allTab" : DOC_TYPES[k].labelKey);

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0 flex flex-col gap-4">
                <h1 className={`text-3xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                    {t("portfolio.title")}
                </h1>

                {hasCv === false && <RequiredFilesNotice dark={dark}/>}

                {uploadOpen && (
                    <PortfolioUpload dark={dark} maxBytes={maxBytes}
                                     onUploaded={reloadLists} onClose={() => setUploadOpen(false)}/>
                )}

                <div className="flex flex-wrap gap-2" role="tablist">
                    {TABS.map((k) => (
                        <Button key={k} role="tab" aria-selected={tab === k} lockTone dark={dark}
                                tone={tab === k ? "primary" : "neutral"} onClick={() => setTab(k)}>
                            {tabLabel(k)}
                        </Button>
                    ))}
                </div>

                {TABS.map((k) => (
                    <div key={k} role="tabpanel" hidden={tab !== k}>
                        <DocumentList type={k} dark={dark}
                                      reloadToken={reloadToken}
                                      onTypeChanged={reloadLists}
                                      uploadOpen={uploadOpen}
                                      onAddClick={() => setUploadOpen(true)}
                                      onCloseClick={() => setUploadOpen(false)}/>
                    </div>
                ))}
            </div>
        </div>
    );
}