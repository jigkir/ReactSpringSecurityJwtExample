import {useCallback, useEffect, useState} from "react";
import {usePolling} from "./usePolling.js";



export function useLoadedList(fetchList) {
    const [items, setItems] = useState(null);
    const [failed, setFailed] = useState(false);

    const reload = useCallback(async () => {
        try {
            setItems(await fetchList());
            setFailed(false);
        } catch {
            setFailed(true);
        }
    }, [fetchList]);

    useEffect(() => {
        void reload();
    }, [reload]);

    usePolling(reload);

    return {items, setItems, failed, reload};
}
