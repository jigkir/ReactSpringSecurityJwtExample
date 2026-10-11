/**
 * CardPreview.jsx — Preview block shown inside a Home card.
 * Location: src/components/home/CardPreview.jsx
 *
 * Calls `load()` once (loaders are stable module-level functions) and shows:
 *   loading  → skeleton
 *   failed   → nothing (the card still works as a plain link)
 *   empty    → "nothing here yet"
 *   data     → status pills + a short list of items
 *
 * Props
 *   load      () => Promise<{stats, items}>   see previewLoaders.js
 *   itemsKey  translation key for the list label
 *   classes   result of getHomeClasses(dark)
 */

import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Icon from '../../styles/Icon.jsx';

// region Constants
// [status, translation key, Material Symbols icon]
const STAT_ORDER = [
    ["PENDING", "home.preview.pending", "schedule"],
    ["APPROVED", "home.preview.approved", "check_circle"],
    ["REJECTED", "home.preview.rejected", "close"],
];

// endregion

export default function CardPreview({load, itemsKey = "home.preview.latest", classes}) {
    const {t} = useTranslation();
    const [data, setData] = useState(null);   // null = loading
    const [failed, setFailed] = useState(false);

    // region Data loading
    useEffect(() => {
        let cancelled = false;
        load()
            .then((d) => !cancelled && setData(d))
            .catch(() => !cancelled && setFailed(true));
        return () => {
            cancelled = true;
        };
    }, [load]);

    // endregion

    // region States (failed / loading / empty)
    if (failed) return null;

    if (!data) {
        return (
            <div className="flex flex-col gap-2 animate-pulse" aria-busy="true">
                <div className={`h-5 w-2/3 rounded ${classes.skel}`}/>
                <div className={`h-4 w-1/2 rounded ${classes.skel}`}/>
            </div>
        );
    }

    const total = data.stats.PENDING + data.stats.APPROVED + data.stats.REJECTED;
    if (total === 0) return <p className={classes.previewEmpty}>{t("home.preview.empty")}</p>;

    // endregion

    // region Render
    return (
        <div className={classes.preview}>
            <div className="flex flex-wrap gap-2">
                {STAT_ORDER.filter(([key]) => data.stats[key] > 0).map(([key, labelKey, icon]) => (
                    <span key={key} className={classes.statPill(key)}>
                        <Icon name={icon} size={14}/>
                        {t(labelKey)} · {data.stats[key]}
                    </span>
                ))}
            </div>

            {data.items.length > 0 && (
                <div>
                    <p className={classes.previewLabel}>{t(itemsKey)}</p>
                    <ul className={classes.previewList}>
                        {data.items.map(({id, text, sub}) => (
                            <li key={id} className={classes.previewItem}>
                                <span className="font-medium truncate">{text}</span>
                                {sub && <span className={classes.previewSub}>{sub}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
    // endregion
}