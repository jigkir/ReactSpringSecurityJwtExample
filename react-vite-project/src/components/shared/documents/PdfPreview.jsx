


import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {getCvPreviewClasses} from "../../../styles/theme/AppStyles.jsx";
import PdfViewer from "./PdfViewer.jsx";

const PdfPreview = ({doc, dark, getUrl}) => {
    const {t} = useTranslation();
    const [url, setUrl] = useState(null);
    const [error, setError] = useState(false);



    const token = useRef(0);
    const ownedUrl = useRef(null);
    const cls = getCvPreviewClasses(dark);


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

export default PdfPreview;
