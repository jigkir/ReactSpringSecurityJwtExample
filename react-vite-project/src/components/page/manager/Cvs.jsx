/**
 * Manager page: review student CVs pending validation.
 *
 * Route /manager/cvs
 *
 * Access control is handled by <RequireRole roles={["MANAGER"]}/> in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from "react-router-dom";
import CvReviewList from "../../cvs/CvReviewList.jsx";
import {getAuthClasses} from "../../../styles/AppStyles.jsx";

const Cv = () => {
    const {dark} = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0">
                <CvReviewList dark={dark}/>
            </div>
        </div>
    );
};

export default Cv;