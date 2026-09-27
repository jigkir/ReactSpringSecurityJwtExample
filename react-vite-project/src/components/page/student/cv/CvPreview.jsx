/**
 * CvPreview.jsx — In-app PDF viewer modal.
 *
 * Rendered by CvDocuments when the student clicks "Aperçu".
 * Handles Escape-to-close, body-scroll-lock, blob-URL lifecycle,
 * and the loading / error states of the iframe.
 *
 * Props
 *   doc      { id, fileName }
 *   dark     boolean
 *   getUrl   (cvId: number) => Promise<string>   returns a blob: URL
 *   onClose  () => void
 */

import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../../styles/Button.jsx';
import {getCvPreviewClasses} from '../../../../styles/appStyles.jsx';

const CvPreview = ({doc, dark, getUrl, onClose}) => {
    const {t} = useTranslation();
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(false);

    // Monotonic token — discards stale getUrl resolutions if the user
    // closes and reopens the preview before the previous fetch settles.
    const token = useRef(0);
    const ownedUrl = useRef(null);
    const cls = getCvPreviewClasses(dark);

    // Fetch blob URL; revoke previous one if the doc changes mid-session.
    useEffect(() => {
        let alive = true;
        const t = ++token.current;
        setUrl(null);
        setError(false);

        getUrl(doc.id)
            .then((u) => {
                if (!alive || t !== token.current) {
                    URL.revokeObjectURL(u);
                    return;
                }
                // Revoke any previously owned URL before storing the new one.
                if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
                ownedUrl.current = u;
                setUrl(u);
            })
            .catch(() => {
                if (alive && t === token.current) setError(true);
            });

        return () => {
            alive = false;
            if (ownedUrl.current) {
                URL.revokeObjectURL(ownedUrl.current);
                ownedUrl.current = null;
            }
        };
    }, [doc.id, getUrl]);

    return (
        <div className={cls.dialog}>

            {/* Header */}
            <div className={cls.header}>
                <h3 id="cv-preview-title" className={cls.title}>{doc.fileName}</h3>
                <div className="flex shrink-0 items-center gap-2">
                    <Button tone="accent" dark={dark} onClick={onClose} autoFocus>
                        {t("cvPreview.closeBtn")}
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className={cls.body}>
                {error ? (
                    <p className={`${cls.muted} pt-16`} role="alert">{t("cvPreview.error")}</p>
                ) : !url ? (
                    <p className={`${cls.muted} pt-16`} aria-busy="true">{t("cvPreview.loading")}</p>
                ) : (
                    <iframe src={url} title={doc.fileName} className="h-full w-full border-0 bg-white"/>
                )}
            </div>
        </div>
    );
};

export default CvPreview;