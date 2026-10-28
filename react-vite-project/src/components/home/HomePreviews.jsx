/**
 * homePreviews.jsx — Which page previews the Home page shows for each role.
 * Location: src/components/home/homePreviews.jsx
 *
 * to         page the heading links to
 * titleKey   translation key of the heading
 * render     (user) => the page component in `preview` mode
 */

import Cv from '../page/student/Cv.jsx';
import StudentInternships from '../page/student/Internships.jsx';
import ManagerCv from '../page/manager/Cv.jsx';
import ManagerInternships from '../page/manager/Internships.jsx';
import PostInternship from '../page/internship/PostInternship.jsx';
import Applications from '../page/application/Applications.jsx';

export const PREVIEWS_BY_ROLE = {
    STUDENT: [
        {to: "/cv", titleKey: "home.cvTitle", render: () => <Cv preview/>},
        {to: "/internship", titleKey: "home.internshipsTitle", render: () => <StudentInternships preview/>},
    ],
    EMPLOYER: [
        {to: "/internships", titleKey: "home.internshipsTitle", render: (user) => <PostInternship user={user} preview/>},
        {to: "/applications", titleKey: "home.applicationsTitle", render: (user) => <Applications user={user} preview/>},
    ],
    MANAGER: [
        {to: "/manager/cvs", titleKey: "home.cvTitle", render: () => <ManagerCv preview/>},
        {to: "/manager/internships", titleKey: "home.internshipsTitle", render: () => <ManagerInternships preview/>},
    ],
    TEACHER: [],
};