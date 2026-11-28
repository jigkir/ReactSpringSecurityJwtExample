import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";
import DocumentList from "./DocumentList.jsx";
import PortfolioUpload from "./PortfolioUpload.jsx";
import {getMaxCvSize} from "../../shared/core/api/Api.jsx";
import {FALLBACK_MAX_BYTES} from "../../../utils/Documents.js";
import {DOC_TYPE_KEYS, DOC_TYPES} from "../../../utils/DocumentTypes.js";

const TABS = ["ALL", ...DOC_TYPE_KEYS];

export default function PortfolioContent({
                                             dark, selection = null, uploadTypes = DOC_TYPE_KEYS,
                                             initialTab = "ALL", onUploaded, onChanged,
                                         }) {
    const {t} = useTranslation();
    const [tab, setTab] = useState(initialTab);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);

    useEffect(() => {
        getMaxCvSize().then(setMaxBytes).catch(() => {
        });
    }, []);

    const reloadLists = () => {
        setReloadToken((value) => value + 1);
        onChanged?.();
    };
    const tabLabel = (key) => t(key === "ALL" ? "portfolio.allTab" : DOC_TYPES[key].labelKey);

    return (
        <div className="flex w-full flex-col gap-4">
            {uploadOpen && (
                <PortfolioUpload
                    dark={dark}
                    maxBytes={maxBytes}
                    types={uploadTypes}
                    defaultType={tab}
                    onUploaded={() => {
                        reloadLists();
                        onUploaded?.();
                    }}
                    onClose={() => setUploadOpen(false)}
                />
            )}

            <div className="flex flex-wrap gap-2" role="tablist">
                {TABS.map((key) => (
                    <Button key={key} role="tab" aria-selected={tab === key} lockTone dark={dark}
                            tone={tab === key ? "primary" : "neutral"} onClick={() => setTab(key)}>
                        {tabLabel(key)}
                    </Button>
                ))}
            </div>

            {TABS.map((key) => (
                <div key={key} role="tabpanel" hidden={tab !== key}>
                    <DocumentList
                        type={key}
                        dark={dark}
                        selection={selection}
                        reloadToken={reloadToken}
                        onTypeChanged={selection ? undefined : reloadLists}
                        uploadOpen={uploadOpen}
                        onAddClick={() => setUploadOpen(true)}
                        onCloseClick={() => setUploadOpen(false)}
                    />
                </div>
            ))}
        </div>
    );
}
