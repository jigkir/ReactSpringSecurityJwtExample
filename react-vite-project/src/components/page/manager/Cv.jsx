/**
 * Manager page: review student CVs pending validation.
 * Reuses CvDocuments in manager mode (preview / approve / refuse / status).
 *
 * <Cv />          full page (route /manager/cvs)
 * <Cv preview />  Home page block: the latest CVs still waiting for review, no filters
 *
 * Access control is handled by <RequireRole roles={["MANAGER"]}/> in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from 'react-router-dom';
import CvDocuments from '../cv/CvDocuments.jsx';
import {getAuthClasses} from '../../../styles/AppStyles.jsx';

const Cv = ({preview = false}) => {
    const {dark} = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    if (preview) return <CvDocuments mode="manager" dark={dark} preview/>;

    return (
        <div className={pageClass}>
            <div className="w-full max-w-4xl">
                <CvDocuments mode="manager" dark={dark}/>
            </div>
        </div>
    );
};

export default Cv;