/**
 * Manager page: internship contracts to sign.
 *
 * Route /manager/contracts
 *
 * Access control is handled by <RequireRole roles={["MANAGER"]}/> in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from "react-router-dom";
import ContractReviewList from "../../contracts/ContractReviewList.jsx";
import {getAuthClasses} from "../../../styles/AppStyles.jsx";

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