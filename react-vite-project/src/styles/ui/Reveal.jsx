import {getRevealClasses} from "../theme/AppStyles.jsx";
import {useRevealOnScroll} from "../../utils/hooks/useRevealOnScroll.js";


function Reveal({from, className = "", children}) {
    const [ref, revealed] = useRevealOnScroll();

    return (
        <div ref={ref} className={`${getRevealClasses(from, revealed)} ${className}`}>
            {children}
        </div>
    );
}

export default Reveal;
