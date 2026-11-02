import {useCallback, useState} from 'react';

// A set of ids that can be toggled (open previews, expanded rows…)
export function useToggleSet() {
    const [ids, setIds] = useState([]);

    const toggle = useCallback((id) => {
        setIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }, []);

    const has = useCallback((id) => ids.includes(id), [ids]);

    return {has, toggle};
}
