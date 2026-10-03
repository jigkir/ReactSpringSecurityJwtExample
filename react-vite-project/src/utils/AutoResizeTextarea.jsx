import {useLayoutEffect, useRef} from 'react';

// Textarea that grows/shrinks with its content (no inner scrollbar, no manual resize).
const AutoResizeTextarea = ({value, className = "", ...props}) => {
    const ref = useRef(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value}
            className={`${className} resize-none overflow-hidden`}
            {...props}
        />
    );
};

export default AutoResizeTextarea;