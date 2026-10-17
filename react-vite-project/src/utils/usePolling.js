import {useEffect} from 'react';

// Short enough for changes to appear quickly, long enough to avoid overloading the server
export const REFRESH_INTERVAL_MS = 10_000;

// Time left before the clock reaches the next multiple of REFRESH_INTERVAL_MS
const delayUntilNextTick = () => REFRESH_INTERVAL_MS - (Date.now() % REFRESH_INTERVAL_MS);

// Calls `callback` every REFRESH_INTERVAL_MS while `enabled` is true.
// Refreshes are aligned on the clock, so every component using this hook
// reloads at the same moment and the displayed data stays consistent.
export function usePolling(callback, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        let intervalId;
        const timeoutId = setTimeout(() => {
            void callback();
            intervalId = setInterval(() => void callback(), REFRESH_INTERVAL_MS);
        }, delayUntilNextTick());

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [callback, enabled]);
}