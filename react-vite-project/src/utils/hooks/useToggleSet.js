import {useCallback, useState} from "react";


export function useToggleSet() {
    const [ids, setIds] = useState([]);

    const toggle = useCallback((id) => {
        setIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }, []);

    const has = useCallback((id) => ids.includes(id), [ids]);

    return {has, toggle};
}
