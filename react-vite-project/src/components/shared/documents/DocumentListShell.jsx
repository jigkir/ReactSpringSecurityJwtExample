


import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import {getCvDocumentsClasses} from "../../../styles/theme/AppStyles.jsx";

export default function DocumentListShell({
                                              dark, title, headerAction, label, items, failed, onRetry,
                                              emptyText, actionError, toolbar, children,
                                          }) {
    const {t} = useTranslation();
    const th = getCvDocumentsClasses(dark);

    const errorBox = actionError && (
        <div className={th.error} role="alert" aria-live="assertive">{t(actionError)}</div>
    );

    let body;
    if (failed) {
        body = (
            <div className={th.muted} role="alert">
                <p>{t("cvDocuments.loadError")}</p>
                <Button tone="neutral" dark={dark} onClick={() => void onRetry()} className="mt-3">
                    {t("cvDocuments.retryBtn")}
                </Button>
            </div>
        );
    } else if (items === null) {
        body = (
            <div className="px-6 py-4 flex flex-col gap-6 animate-pulse" aria-busy="true">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className={`h-4 w-1/3 rounded ${th.skel}`}/>
                        <div className={`h-3 w-1/2 rounded ${th.skel}`}/>
                    </div>
                ))}
            </div>
        );
    } else if (items.length === 0) {
        body = <p className={th.muted}>{emptyText}</p>;
    } else {
        body = children;
    }

    return (
        <section className={th.card} aria-label={label ?? title}>
            {(title || headerAction) && (
                <div className={th.header}>
                    {title && <h2 className={th.title}>{title}</h2>}
                    {headerAction && <div className="ml-auto">{headerAction}</div>}
                </div>
            )}
            {errorBox && <div className="px-6 pt-4">{errorBox}</div>}
            {toolbar}
            {body}
        </section>
    );
}
