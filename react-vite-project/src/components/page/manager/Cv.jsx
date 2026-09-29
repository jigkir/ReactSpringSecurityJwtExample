/**
 * Manager page: review student CVs pending validation.
 * Reuses CvDocuments in manager mode (preview / approve / refuse / status).
 */

import {Navigate, useOutletContext} from 'react-router-dom';
import CvDocuments from '../student/cv/CvDocuments.jsx';
import {getAuthClasses} from '../../../styles/appStyles.jsx';

const Cv = () => {
    const {dark, user} = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    // Not authenticated at all
    if (!localStorage.getItem("token")) return <Navigate to="/login" replace/>;
    // User still loading (App fetches users/current), don't hit manager endpoints yet
    if (!user?.isLoggedIn) return <div className={pageClass} aria-busy="true"/>;
    // Logged in but not a manager (the backend also enforces this)
    if (user.role !== "MANAGER") return <Navigate to="/home" replace/>;

    return (
        <div className={pageClass}>
            <div className="w-full max-w-4xl">
                <CvDocuments mode="manager" dark={dark}/>
            </div>
        </div>
    );
};

export default Cv;