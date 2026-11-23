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
 * Every tile opens the page: the top bar unfiltered, the others with
 * `?<section.param>=<COLOR>` (read by the page as the initial filter).
 * A tile whose count is 0 is disabled: not a link, faded, not focusable.
 * The tile texts are the wording of the page's filter select (STATUS_LABEL_KEYS in StatusColor.js).
 * The counts come from `section.load`, refreshed by usePolling (every 10 s).
 * Sections that list the navbar session wait for `selectedSession`.
 *
 * Props: section (see HomeSections.js), user, dark
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

function HomeSection({section, user, dark}) {
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
        <section aria-label={t(titleKey)} className={s.section}>
            <Button as={Link} to={to} tone="primary" lockTone size="lg" dark={dark}
                    aria-label={`${t(titleKey)} (${countText(ALL)})`}
                    className={s.allBar}>
                <span className={s.allTitle}>{t(titleKey)}</span>
                <span className="flex items-center gap-3">
                    <span className={s.allTotal} aria-live="polite">{countText(ALL)}</span>
                    <Icon name="arrow_forward" size={20} className={s.allArrow}/>
                </span>
            </Button>

            <div className={s.grid(buttonColors.length)}>
                {buttonColors.map(renderTile)}
            </div>
        </section>
    );
}

export default HomeSection;
