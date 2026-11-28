import {useEffect} from "react";


export const REFRESH_INTERVAL_MS = 10_000;


const delayUntilNextTick = () => REFRESH_INTERVAL_MS - (Date.now() % REFRESH_INTERVAL_MS);




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
