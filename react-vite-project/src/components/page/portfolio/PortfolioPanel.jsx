/**
 * PortfolioPanel.jsx — The portfolio view (tabs + document lists + upload panel) without the
 * page title, so it can be embedded (e.g. inside an internship card when applying).
 * Tabs: All | CV | Cover letters | Transcripts, all rendered by <DocumentList />.
 * The upload panel preselects the type of the tab being viewed.
 *
 * Props
 *   dark         boolean
 *   selection    optional {cvId, letterId, onPickCv(id), onPickLetter(id), disabled}
 *                → "pick" mode: checkboxes on CVs (approved only, no status) and cover letters,
 *                  no Change type / Delete buttons
 *   uploadTypes  string[]  optional, document types the upload panel offers (default: all)
 *   onUploaded   function  optional, called after an upload attempt
 */

import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import DocumentList from './DocumentList.jsx';
import PortfolioUpload from './PortfolioUpload.jsx';
import {getMaxCvSize} from '../../api/Api.jsx';
import {FALLBACK_MAX_BYTES} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';

const TABS = ["ALL", ...DOC_TYPE_KEYS];

function PortfolioPanel({dark, selection = null, uploadTypes = DOC_TYPE_KEYS, onUploaded}) {
    const {t} = useTranslation();
    const [tab, setTab] = useState("ALL");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);

    useEffect(() => {
        getMaxCvSize().then(setMaxBytes).catch(() => {
        });
    }, []);

    const reloadLists = () => setReloadToken((v) => v + 1);
    const tabLabel = (k) => t(k === "ALL" ? "portfolio.allTab" : DOC_TYPES[k].labelKey);

    return (
        <div className="flex w-full flex-col gap-4">
            {uploadOpen && (
                <PortfolioUpload dark={dark} maxBytes={maxBytes} types={uploadTypes} defaultType={tab}
                                 onUploaded={() => {
                                     reloadLists();
                                     onUploaded?.();
                                 }}
                                 onClose={() => setUploadOpen(false)}/>
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
                                  selection={selection}
                                  reloadToken={reloadToken}
                                  onTypeChanged={selection ? undefined : reloadLists}
                                  uploadOpen={uploadOpen}
                                  onAddClick={() => setUploadOpen(true)}
                                  onCloseClick={() => setUploadOpen(false)}/>
                </div>
            ))}
        </div>
    );
}

export default PortfolioPanel;