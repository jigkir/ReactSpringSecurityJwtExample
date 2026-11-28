import {useEffect, useState} from "react";
import {getDocument} from "./pdfLoader.js";


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
