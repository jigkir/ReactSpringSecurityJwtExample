/**
 * Student page: internship contracts to sign.
 *
 * Route /student/contracts
 *
 * Location: components/page/student/contracts/Contracts.jsx
 * The role (signature field, base route of the contract page) is read from the user
 * by ContractReviewList: see utils/ContractRole.js.
 *
 * Access control is handled by <RequireRole roles={["STUDENT"]}/> in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from "react-router-dom";
import ContractReviewList from "../../features/contracts/ContractReviewList.jsx";
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