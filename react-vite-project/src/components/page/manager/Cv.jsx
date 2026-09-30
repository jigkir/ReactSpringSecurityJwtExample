/**
 * Manager page: review student CVs pending validation.
 * Reuses CvDocuments in manager mode (preview / approve / refuse / status).
 *
 * Access control is handled by <RequireRole roles={["MANAGER"]}/> in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from 'react-router-dom';
import CvDocuments from '../student/cv/CvDocuments.jsx';
import {getAuthClasses} from '../../../styles/appStyles.jsx';

const Cv = () => {
    const {dark} = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    return (
        <div className={pageClass}>
            <div className="w-full max-w-4xl">
                <CvDocuments mode="manager" dark={dark}/>
            </div>
        </div>
    );
};

export default Cv;