/**
 * Portfolio.jsx — Student portfolio page (route /portfolio).
 * Tabs: CV | Cover letters | Transcripts. One upload panel accepts several PDFs at once,
 * each with its own type.
 */

import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import {getAuthClasses} from '../../../styles/AppStyles.jsx';
import CvDocuments from '../cv/CvDocuments.jsx';
import DocumentList from './DocumentList.jsx';
import PortfolioUpload from './PortfolioUpload.jsx';
import {getMaxCvSize} from '../../api/Api.jsx';
import {FALLBACK_MAX_BYTES} from '../cv/cvUtils.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';

export default function Portfolio() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {pageClass} = getAuthClasses(dark);
    const [tab, setTab] = useState("CV");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [version, setVersion] = useState(0); // remounts the lists after an upload
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);

    useEffect(() => {
        getMaxCvSize().then(setMaxBytes).catch(() => {
        });
    }, []);

    const openUpload = () => setUploadOpen(true);

    return (
        <div className={pageClass}>
            <div className="w-full max-w-4xl flex flex-col gap-4">
                <h1 className={`text-3xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                    {t("portfolio.title")}
                </h1>

                <div className="flex flex-wrap gap-2" role="tablist">
                    {DOC_TYPE_KEYS.map((k) => (
                        <Button key={k} role="tab" aria-selected={tab === k} lockTone dark={dark}
                                tone={tab === k ? "primary" : "neutral"} onClick={() => setTab(k)}>
                            {t(DOC_TYPES[k].labelKey)}
                        </Button>
                    ))}
                </div>

                {uploadOpen && (
                    <PortfolioUpload dark={dark} maxBytes={maxBytes}
                                     onUploaded={() => setVersion((v) => v + 1)}
                                     onClose={() => setUploadOpen(false)}/>
                )}

                {tab === "CV"
                    ? <CvDocuments key={version} dark={dark} onAddClick={openUpload}/>
                    : <DocumentList key={`${tab}-${version}`} type={tab} dark={dark} onAddClick={openUpload}/>}
            </div>
        </div>
    );
}