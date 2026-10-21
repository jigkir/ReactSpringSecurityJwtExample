/**
 * CvPreview.jsx — In-app PDF viewer (react-pdf, no iframe).
 *
 * Props
 *   doc      { id, fileName }
 *   dark     boolean
 *   getUrl   (cvId: number) => Promise<string>   returns a blob: URL
 */

import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Document, Page, pdfjs} from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {getCvPreviewClasses} from '../../../styles/AppStyles.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const CvPreview = ({doc, dark, getUrl}) => {
    const {t} = useTranslation();
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [page, setPage] = useState(1);

    const token = useRef(0);
    const ownedUrl = useRef(null);
    const cls = getCvPreviewClasses(dark);

    useEffect(() => {
        let alive = true;
        const tk = ++token.current;
        setUrl(null);
        setError(false);
        setPage(1);

        getUrl(doc.id)
            .then((u) => {
                if (!alive || tk !== token.current) {
                    URL.revokeObjectURL(u);
                    return;
                }
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
        <div className="h-full w-full overflow-y-auto">
            <Document
                file={url}
                onLoadSuccess={({numPages}) => setNumPages(numPages)}
                onLoadError={() => setError(true)}
                loading={<p className={cls.muted}>{t("cvPreview.loading")}</p>}
            >
                {Array.from({length: numPages}, (_, i) => (
                    <Page
                        key={i + 1}
                        pageNumber={i + 1}
                        width={Math.min(800, window.innerWidth - 48)}
                        className="mb-4 shadow"
                    />
                ))}
            </Document>
        </div>
    );
};

export default CvPreview;