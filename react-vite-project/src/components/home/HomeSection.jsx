/**
 * HomeSection.jsx — One Home section: a blue bar (whole page) over color buttons with live counts.
 * Location: src/components/home/HomeSection.jsx
 *
 * Layout (see the handoff screenshot)
 *   [ BLUE  title ........................ total ]
 *   [ GREEN ]   [ YELLOW ]   [ RED ]
 *
 * Every button is a <Link> to the page: the blue bar opens it unfiltered, the others add
 * `?<section.param>=<COLOR>` (read by the page as the initial filter).
 * The button texts are the wording of the page's filter select (STATUS_LABEL_KEYS in StatusColor.js).
 * The counts come from `section.load`, refreshed by usePolling (every 10 s).
 * Sections that list the navbar session wait for `selectedSession`.
 *
 * Props: section (see HomeSections.js), user
 */

import {useCallback, useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Icon from "../../styles/Icon.jsx";
import {ALL, statusLabelKey} from "../../utils/StatusColor.js";
import {usePolling} from "../../utils/usePolling.js";
import {useSession} from "../../utils/useSession.js";

const COLOR_CLASSES = {
    ALL: "bg-blue-600 hover:bg-blue-700 text-white",
    GREEN: "bg-emerald-600 hover:bg-emerald-700 text-white",
    YELLOW: "bg-amber-400 hover:bg-amber-500 text-slate-900",
    RED: "bg-red-600 hover:bg-red-700 text-white",
};

const BASE = "group flex items-center justify-between gap-3 rounded-xl px-5 py-4 font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const GRID_COLS = {1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3"};

function HomeSection({section, user}) {
    const {t} = useTranslation();
    const {selectedSession} = useSession();
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

    const countText = (color) => (counts ? String(counts[color] ?? 0) : failed ? "–" : "…");
    const hrefOf = (color) => `${to}?${param}=${color}`;
    const labelOf = (color) => {
        const key = statusLabelKey(page, color);
        return key ? t(key) : color;
    };

    return (
        <section aria-label={t(titleKey)} className="min-w-0 w-full flex flex-col gap-3">
            <Link to={to} aria-label={`${t(titleKey)} (${countText(ALL)})`}
                  className={`${BASE} ${COLOR_CLASSES.ALL} w-full text-base sm:text-xl`}>
                <span className="min-w-0 wrap-break-word">{t(titleKey)}</span>
                <span className="flex items-center gap-3">
                    <span className="text-2xl tabular-nums" aria-live="polite">{countText(ALL)}</span>
                    <Icon name="arrow_forward" size={24} className="transition-transform group-hover:translate-x-1"/>
                </span>
            </Link>

            <div className={`grid grid-cols-1 gap-3 ${GRID_COLS[buttonColors.length] ?? "sm:grid-cols-3"}`}>
                {buttonColors.map((color) => (
                    <Link key={color} to={hrefOf(color)}
                          aria-label={`${t(titleKey)} – ${labelOf(color)} (${countText(color)})`}
                          className={`${BASE} ${COLOR_CLASSES[color]} text-sm sm:text-base`}>
                        <span className="min-w-0 wrap-break-word">{labelOf(color)}</span>
                        <span className="text-2xl tabular-nums">{countText(color)}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default HomeSection;
