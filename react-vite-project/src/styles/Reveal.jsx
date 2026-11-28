import {getRevealClasses} from "./AppStyles.jsx";
import {useRevealOnScroll} from "../utils/useRevealOnScroll.js";

// Shows its content with a transition (REVEAL_FROM) the first time it is visible on screen
function Reveal({from, className = "", children}) {
    const [ref, revealed] = useRevealOnScroll();

    return (
        <div ref={ref} className={`${getRevealClasses(from, revealed)} ${className}`}>
            {children}
        </div>
    );
}

export default Reveal;