import {useCallback, useEffect, useState} from 'react';
import {usePolling} from './usePolling.js';

/**
 * Loads a list with `fetchList`, then keeps it fresh on the polling clock.
 * `fetchList` must be stable (a module-level function or a useCallback).
 *
 * Returns
 *   items     null while loading, then the list
 *   setItems  lets a caller patch one row after an action instead of reloading
 *   failed    true when the last load failed
 *   reload    manual reload (retry button, after a mutation)
 */
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
