


import {useOutletContext} from "react-router-dom";
import CvReviewList from "../../features/cvs/CvReviewList.jsx";
import {getAuthClasses} from "../../../styles/theme/AppStyles.jsx";

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
