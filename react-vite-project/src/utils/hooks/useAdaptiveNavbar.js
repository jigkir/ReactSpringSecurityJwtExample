import {useCallback, useEffect, useLayoutEffect, useReducer, useState} from "react";


export const LAST_LEVEL = 3;


const overflows = (row) =>
    row.scrollWidth > row.clientWidth + 1 ||
    row.getBoundingClientRect().right > document.documentElement.clientWidth + 1;



export function useAdaptiveNavbar(ref, signature) {
    const [level, setLevel] = useState(0);
    const [lastSignature, setLastSignature] = useState(signature);
    const [, forceRender] = useReducer((n) => n + 1, 0);


    if (lastSignature !== signature) {
        setLastSignature(signature);
        setLevel(0);
    }

    const restart = useCallback(() => {
        setLevel(0);
        forceRender();
    }, []);


    useLayoutEffect(() => {
        const row = ref.current;
        if (row && level < LAST_LEVEL && overflows(row)) {
            setLevel(level + 1);
        }
    });

    useEffect(() => {
        const row = ref.current;
        if (!row) return;


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
