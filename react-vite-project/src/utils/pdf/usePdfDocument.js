import {useEffect, useState} from 'react';
import {getDocument} from 'pdfjs-dist';

// Loads the PDF at url with pdf.js; error is true when the file cannot be parsed
export function usePdfDocument(url) {
    const [pdf, setPdf] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!url) return;

        let alive = true;
        const loadingTask = getDocument(url);
        loadingTask.promise
            .then((loadedPdf) => {
                if (alive) setPdf(loadedPdf);
            })
            .catch(() => {
                // A destroyed task also rejects: ignore it, it is not a broken file
                if (alive) setError(true);
            });

        return () => {
            alive = false;
            setPdf(null);
            setError(false);
            void loadingTask.destroy();
        };
    }, [url]);

    return {pdf, error};
}