import {useEffect, useRef, useState} from "react";

const VISIBLE_RATIO = 0.2;

export function useRevealOnScroll() {
    const ref = useRef(null);
    const [revealed, setRevealed] = useState(typeof IntersectionObserver === "undefined");

    useEffect(() => {
        const element = ref.current;
        if (revealed || !element) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setRevealed(true);
                observer.disconnect();
            }
        }, {threshold: VISIBLE_RATIO});

        observer.observe(element);

        return () => observer.disconnect();
    }, [revealed]);

    return [ref, revealed];
}
