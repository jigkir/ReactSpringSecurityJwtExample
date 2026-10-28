/**
 * PdfViewer.jsx — Shows every page of a PDF directly in the page, without an inner scrollbar.
 * The pages fit the width of the viewer; Ctrl/Cmd + "+", "-", "0" or Ctrl/Cmd + wheel
 * zooms only the PDF.
 *
 * Props
 *   url    string    blob: URL of the PDF
 *   title  string    accessible name of the viewer
 *   dark   boolean
 */

import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getCvPreviewClasses} from '../../../styles/AppStyles.jsx';
import {usePdfDocument} from '../../../utils/pdf/usePdfDocument.js';
import {useCtrlZoom} from '../../../utils/pdf/useCtrlZoom.js';

const FIRST_PAGE = 1;
const NATURAL_SCALE = 1;

// Renders one PDF page on a canvas, sharp on high-density screens
function PdfPage({pdf, pageNumber, scale}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        let renderTask = null;
        let cancelled = false;

        pdf.getPage(pageNumber).then((page) => {
            if (cancelled) return;

            const pixelRatio = window.devicePixelRatio || 1;
            const viewport = page.getViewport({scale: scale * pixelRatio});
            const canvas = canvasRef.current;

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = `${viewport.width / pixelRatio}px`;
            canvas.style.height = `${viewport.height / pixelRatio}px`;

            renderTask = page.render({canvasContext: canvas.getContext("2d"), viewport});
            renderTask.promise.catch(() => {
                // Cancelled when the zoom changes before the page finishes drawing
            });
        });

        return () => {
            cancelled = true;
            renderTask?.cancel();
        };
    }, [pdf, pageNumber, scale]);

    return <canvas ref={canvasRef} className="mx-auto mb-4 block bg-white shadow last:mb-0"/>;
}

function PdfViewer({url, title, dark}) {
    const {t} = useTranslation();
    const cls = getCvPreviewClasses(dark);
    const containerRef = useRef(null);
    const {pdf, error} = usePdfDocument(url);
    const zoom = useCtrlZoom(containerRef);
    const [fitWidthScale, setFitWidthScale] = useState(null);

    useEffect(() => {
        if (!pdf) return;
        let alive = true;

        // Fit the pages to the viewer width; keep their natural size while the viewer has no width yet
        pdf.getPage(FIRST_PAGE).then((page) => {
            if (!alive) return;
            const viewerWidth = containerRef.current.clientWidth;
            const pageWidth = page.getViewport({scale: NATURAL_SCALE}).width;
            setFitWidthScale(viewerWidth > 0 ? viewerWidth / pageWidth : NATURAL_SCALE);
        });

        return () => {
            alive = false;
            setFitWidthScale(null);
        };
    }, [pdf]);

    let content;
    if (error) {
        content = <p className={cls.muted} role="alert">{t("cvPreview.error")}</p>;
    } else if (!pdf || !fitWidthScale) {
        content = <p className={cls.muted} aria-busy="true">{t("cvPreview.loading")}</p>;
    } else {
        content = Array.from({length: pdf.numPages}, (_, index) => (
            <PdfPage key={index + FIRST_PAGE} pdf={pdf} pageNumber={index + FIRST_PAGE} scale={fitWidthScale * zoom}/>
        ));
    }

    return (
        <div ref={containerRef} tabIndex={0} role="document" aria-label={title} className={cls.viewer}>
            {content}
        </div>
    );
}

export default PdfViewer;