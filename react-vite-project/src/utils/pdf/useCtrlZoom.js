import {useEffect, useState} from 'react';

export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.25;

const ZOOM_IN_KEYS = ["+", "="];
const ZOOM_OUT_KEYS = ["-", "_"];
const RESET_ZOOM_KEY = "0";

const clampZoom = (zoom) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

// Ctrl/Cmd + "+", "-", "0" and Ctrl/Cmd + wheel zoom only the element of containerRef
// (when the pointer is over it or it has the focus) instead of the whole page.
export function useCtrlZoom(containerRef) {
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isPointerInside = false;
        const isTargeted = () => isPointerInside || container.contains(document.activeElement);
        const changeZoom = (delta) => setZoom((current) => clampZoom(current + delta));

        const handleWheel = (event) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            changeZoom(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
        };

        const handleKeyDown = (event) => {
            if ((!event.ctrlKey && !event.metaKey) || !isTargeted()) return;

            if (ZOOM_IN_KEYS.includes(event.key)) changeZoom(ZOOM_STEP);
            else if (ZOOM_OUT_KEYS.includes(event.key)) changeZoom(-ZOOM_STEP);
            else if (event.key === RESET_ZOOM_KEY) setZoom(DEFAULT_ZOOM);
            else return;

            event.preventDefault();
        };

        const handlePointerEnter = () => {
            isPointerInside = true;
        };
        const handlePointerLeave = () => {
            isPointerInside = false;
        };

        container.addEventListener("wheel", handleWheel, {passive: false});
        container.addEventListener("pointerenter", handlePointerEnter);
        container.addEventListener("pointerleave", handlePointerLeave);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("pointerenter", handlePointerEnter);
            container.removeEventListener("pointerleave", handlePointerLeave);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [containerRef]);

    return zoom;
}