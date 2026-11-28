


import {useOutletContext} from "react-router-dom";
import ContractReviewList from "../../features/contracts/ContractReviewList.jsx";
import {getAuthClasses} from "../../../styles/theme/AppStyles.jsx";

const Contracts = () => {
    const {dark, user} = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0">
                <ContractReviewList dark={dark} user={user}/>
            </div>
        </div>
    );
};

export default Contracts;
