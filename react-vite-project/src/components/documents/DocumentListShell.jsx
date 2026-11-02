/**
 * DocumentListShell.jsx — Loading / error / empty states and card around any document list.
 *
 * Full page: card (+ optional title header, action error, toolbar) with a skeleton, a retry
 * block, an empty message, or the rows.
 * `preview` (Home page): no card, states come from <PreviewState />, like every Home preview.
 *
 * Props
 *   dark, preview
 *   title        optional visible header of the card
 *   label        aria-label of the card (defaults to title)
 *   items        the list that will be shown: null while loading
 *   failed       loading failed
 *   onRetry      function  retry button
 *   emptyText    string
 *   actionError  translation KEY of the last failed action (translated here, so it follows the language)
 *   toolbar      node  filters (full page only)
 *   children     the rows (a <ul>)
 */

import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import PreviewState from '../home/PreviewState.jsx';
import {getCvDocumentsClasses} from '../../styles/AppStyles.jsx';

export default function DocumentListShell({
                                              dark, preview = false, title, headerAction, label, items, failed, onRetry,
                                              emptyText, actionError, toolbar, children,
                                          }) {
    const {t} = useTranslation();
    const th = getCvDocumentsClasses(dark);

    const errorBox = actionError && (
        <div className={th.error} role="alert" aria-live="assertive">{t(actionError)}</div>
    );

    if (preview) {
        return (
            <div className="space-y-4">
                {errorBox}
                <PreviewState dark={dark} error={failed} loading={items === null} empty={items?.length === 0}>
                    {children}
                </PreviewState>
            </div>
        );
    }

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
