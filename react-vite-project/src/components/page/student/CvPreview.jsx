/**
 * CvPreview.jsx — In-app PDF viewer modal.
 *
 * Rendered by CvDocuments when the student clicks a file name.
 * Handles Escape-to-close, body-scroll-lock, blob-URL lifecycle,
 * and the loading / error states of the iframe.
 *
 * Props
 *   doc          { id, fileName }   the document being previewed
 *   dark         boolean
 *   getUrl       (cvId) => Promise<string>   fetch blob URL
 *   onClose      () => void
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import CvButton from './CvButton.jsx';

const TEXTS = {
    previewLoading: 'Chargement du document…',
    previewError:   'Impossible d\'afficher ce document.',
    previewNewTab:  'Ouvrir dans un onglet',
    closeBtn:       'Fermer',
};

const CvPreview = ({doc, dark, getUrl, onClose}) => {
    const [url,   setUrl]   = useState(null);
    const [error, setError] = useState(false);
    const token    = useRef(0);
    const ownedUrl = useRef(null);

    const release = useCallback(() => {
        if (ownedUrl.current) {
            URL.revokeObjectURL(ownedUrl.current);
            ownedUrl.current = null;
        }
    }, []);

    // Fetch blob URL on mount; cancel if closed before it arrives.
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
                ownedUrl.current = u;
                setUrl(u);
            })
            .catch(() => {
                if (alive && t === token.current) setError(true);
            });

        return () => {
            alive = false;
            release();
        };
    }, [doc.id, getUrl, release]);

    // Keyboard + scroll-lock
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    // Theme
    const surface = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
    const divider = dark ? 'border-slate-700' : 'border-gray-200';
    const inner   = dark ? 'bg-slate-900' : 'bg-gray-100';
    const muted   = `px-6 py-8 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cv-preview-title"
                onClick={(e) => e.stopPropagation()}
                className={`flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border shadow-xl ${surface}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between gap-4 px-6 py-3 border-b ${divider}`}>
                    <h3
                        id="cv-preview-title"
                        className={`min-w-0 truncate text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}
                    >
                        {doc.fileName}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
                        <CvButton tone="neutral" dark={dark} onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} disabled={!url}>
                            {TEXTS.previewNewTab}
                        </CvButton>
                        <CvButton tone="accent" dark={dark} onClick={onClose} autoFocus>
                            {TEXTS.closeBtn}
                        </CvButton>
                    </div>
                </div>

                {/* Body */}
                <div className={`min-h-0 flex-1 ${inner}`}>
                    {error ? (
                        <p className={`${muted} pt-16`} role="alert">{TEXTS.previewError}</p>
                    ) : !url ? (
                        <p className={`${muted} pt-16`} aria-busy="true">{TEXTS.previewLoading}</p>
                    ) : (
                        <iframe src={url} title={doc.fileName} className="h-full w-full border-0 bg-white"/>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CvPreview;