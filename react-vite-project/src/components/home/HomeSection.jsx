/**
 * HomeSection.jsx — One Home section: a bar (whole page) over status tiles with live counts.
 * Location: src/components/home/HomeSection.jsx
 *
 * Layout
 *   [ ALL    title ........................ total  → ]
 *   [ ● label ........ (n) ]  [ ● label ........ (n) ]  [ ● label ........ (n) ]
 *
 * All the classes live in AppStyles.jsx (getHomeSectionClasses): this file only holds the logic.
 *
 * "See all" opens the page unfiltered; every tile opens it with `?<section.param>=<COLOR>`
 * (read by the page as the initial filter). A tile whose count is 0 is disabled.
 * Counts come from `section.load`, refreshed by usePolling.
 * Sections that list the navbar session wait for `selectedSession`.
 *
 * Props: section (see HomeSections.js), user, dark, span (1..6 columns of the 6-column grid)
 */

import {useCallback, useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Button from "../../styles/Button.jsx";
import Icon from "../../styles/Icon.jsx";
import {getHomeSectionClasses} from "../../styles/AppStyles.jsx";
import {ALL, statusLabelKey} from "../../utils/StatusColor.js";
import {usePolling} from "../../utils/usePolling.js";
import {useSession} from "../../utils/useSession.js";

function HomeSection({section, user, dark, span = 2}) {
    const {t} = useTranslation();
    const {selectedSession} = useSession();
    const s = getHomeSectionClasses(dark);
    const {to, titleKey, page, param, scoped = false, colors: buttonColors, load} = section;
    const sessionId = selectedSession?.id;

    const [colors, setColors] = useState(null); // null = loading
    const [failed, setFailed] = useState(false);

    const refresh = useCallback(async () => {
        if (scoped && !sessionId) return; // sessions still loading
        try {
            const list = await load({sessionId, user});
            setColors(Array.isArray(list) ? list : []);
            setFailed(false);
        } catch {
            setFailed(true);
        }
    }, [load, scoped, sessionId, user]);

    useEffect(() => {
        setColors(null);
        void refresh();
    }, [refresh]);

    usePolling(refresh);

    const counts = useMemo(() => {
        if (!colors) return null;
        const byColor = {[ALL]: colors.length};
        for (const color of colors) if (color) byColor[color] = (byColor[color] ?? 0) + 1;
        return byColor;
    }, [colors]);

    const countOf = (color) => (counts ? (counts[color] ?? 0) : null);
    const countText = (color) => {
        const n = countOf(color);
        return n !== null ? String(n) : failed ? "–" : "…";
    };
    const hrefOf = (color) => `${to}?${param}=${color}`;
    const labelOf = (color) => {
        const key = statusLabelKey(page, color);
        return key ? t(key) : color;
    };

    const renderTile = (color) => {
        const icon = s.tileIcon(color);
        if (!icon) return null;
        const disabled = countOf(color) === 0;
        const label = `${t(titleKey)} – ${labelOf(color)} (${countText(color)})`;

        const content = (
            <>
                <span className={s.tileBadge(color)}>
                    <Icon name={icon} size={22}/>
                </span>
                <span className={s.tileLabel}>{labelOf(color)}</span>
                <span className={s.tileCount(color)}>{countText(color)}</span>
            </>
        );

        if (disabled) {
            return (
                <div key={color} role="link" aria-disabled="true" aria-label={label}
                     className={s.tile(color, true)}>
                    {content}
                </div>
            );
        }

        return (
            <Link key={color} to={hrefOf(color)} aria-label={label} className={s.tile(color, false)}>
                {content}
            </Link>
        );
    };

    return (
        <section aria-label={t(titleKey)} className={`${s.card} ${s.span(span)}`}>
            <header className={s.header}>
                <h2 className={s.title}>{t(titleKey)}</h2>
                <Button as={Link} to={to} tone="ghost" dark={dark} size="sm"
                        className="bg-blue-600! border-transparent! text-white! hover:bg-blue-700! hover:text-white!"
                        aria-label={`${t(titleKey)} (${countText(ALL)})`}>
                    {t("home.seeAll")}
                    <span className="tabular-nums" aria-live="polite">({countText(ALL)})</span>
                </Button>
            </header>

            <div className={s.body}>
                <div className={s.grid(buttonColors.length)}>
                    {buttonColors.map(renderTile)}
                </div>
            </div>
        </section>
    );
}

export default HomeSection;
