/**
 * Manager page: internship contracts to sign.
 *
 * <Contracts />          full page (route /manager/contracts)
 * <Contracts preview />  Home page block: the contracts not signed yet, every session, no header
 *
 * Access control is handled by <RequireRole roles={["MANAGER"]}/> in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from 'react-router-dom';
import ContractReviewList from '../../contracts/ContractReviewList.jsx';
import {getAuthClasses} from '../../../styles/AppStyles.jsx';

const Contracts = ({preview = false}) => {
    const {dark, user} = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    if (preview) return <ContractReviewList dark={dark} user={user} preview/>;

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0">
                <ContractReviewList dark={dark} user={user}/>
            </div>
        </div>
    );
};

export default Contracts;
