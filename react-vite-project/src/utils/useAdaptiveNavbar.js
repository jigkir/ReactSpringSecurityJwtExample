import {useCallback, useEffect, useLayoutEffect, useReducer, useState} from "react";

// 0 = everything, 1 = icon-only buttons, 2 = account in a dropdown, 3 = burger menu
export const LAST_LEVEL = 3;

// The row is too small for its content, or sticks out of the window
const overflows = (row) =>
    row.scrollWidth > row.clientWidth + 1 ||
    row.getBoundingClientRect().right > document.documentElement.clientWidth + 1;

/**
 * Returns the level of detail the navbar row can afford.
 * `ref` is the row that must hold all the items on ONE line (items must not shrink).
 * `signature` is a string that changes whenever the content width can change
 * (language, user, session names...): the measure restarts from level 0.
 */
export function useAdaptiveNavbar(ref, signature) {
    const [level, setLevel] = useState(0);
    const [lastSignature, setLastSignature] = useState(signature);
    const [, forceRender] = useReducer((n) => n + 1, 0);

    // Content changed: start again from the richest level (done during render, so no extra paint)
    if (lastSignature !== signature) {
        setLastSignature(signature);
        setLevel(0);
    }

    const restart = useCallback(() => {
        setLevel(0);
        forceRender();
    }, []);

    // Runs after every render, before the paint: if the row overflows, remove one more thing
    useLayoutEffect(() => {
        const row = ref.current;
        if (row && level < LAST_LEVEL && overflows(row)) {
            setLevel(level + 1);
        }
    });

    useEffect(() => {
        const row = ref.current;
        if (!row) return;

        // Available width changed (resize, rotation, zoom): try the richest level again
        let lastWidth = document.documentElement.clientWidth;
        const onWidthChange = () => {
            const width = document.documentElement.clientWidth;
            if (width !== lastWidth) {
                lastWidth = width;
                restart();
            }
        };

        const observer = new ResizeObserver(onWidthChange);
        observer.observe(row);
        observer.observe(document.documentElement);
        window.addEventListener('resize', onWidthChange);

        // The icon font changes the width of the buttons once it is loaded
        document.fonts?.ready.then(restart);
        document.fonts?.addEventListener?.('loadingdone', restart);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', onWidthChange);
            document.fonts?.removeEventListener?.('loadingdone', restart);
        };
    }, [ref, restart]);

    return level;
}