/**
 * CvPreview.jsx — Shows a CV directly in the page.
 *
 * Fetches the PDF as a blob URL, handles its lifecycle and the loading / error
 * states, then lets PdfViewer draw it.
 *
 * Props
 *   doc      { id, fileName }
 *   dark     boolean
 *   getUrl   (cvId: number) => Promise<string>   returns a blob: URL
 */

import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getCvPreviewClasses} from '../../../styles/AppStyles.jsx';
import PdfViewer from './PdfViewer.jsx';

const CvPreview = ({doc, dark, getUrl}) => {
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
        const tk = ++token.current;
        setUrl(null);
        setError(false);

        getUrl(doc.id)
            .then((u) => {
                if (!alive || tk !== token.current) {
                    URL.revokeObjectURL(u);
                    return;
                }
                // Revoke any previously owned URL before storing the new one.
                if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
                ownedUrl.current = u;
                setUrl(u);
            })
            .catch(() => {
                if (alive && tk === token.current) setError(true);
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

            {/* Body */}
            <div className={cls.body}>
                {error ? (
                    <p className={cls.muted} role="alert">{t("cvPreview.error")}</p>
                ) : !url ? (
                    <p className={cls.muted} aria-busy="true">{t("cvPreview.loading")}</p>
                ) : (
                    <PdfViewer url={url} title={doc.fileName} dark={dark}/>
                )}
            </div>
        </div>
    );
};

export default CvPreview;