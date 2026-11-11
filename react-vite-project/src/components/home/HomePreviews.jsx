/**
 * homePreviews.jsx — Which page previews the Home page shows for each role.
 * Location: src/components/home/homePreviews.jsx
 *
 * to         page the heading links to
 * titleKey   translation key of the heading (descriptive, specific to the role)
 * render     (user) => the page component in `preview` mode
 */

import PortfolioPreview from '../page/portfolio/PortfolioPreview.jsx';
import StudentInternships from '../page/student/Internships.jsx';
import Interviews from '../page/student/Interviews.jsx';
import ManagerCv from '../page/manager/Cv.jsx';
import ManagerInternships from '../page/manager/Internships.jsx';
import PostInternship from '../page/employer/internship/PostInternship.jsx';
import Applications from '../page/employer/application/Applications.jsx';
import EmployerInterviews from "../page/employer/interview/EmployerInterviews.jsx";

export const PREVIEWS_BY_ROLE = {
    STUDENT: [
        {to: "/portfolio", titleKey: "home.studentCvLink", render: () => <PortfolioPreview/>},
        {to: "/internship", titleKey: "home.studentInternshipsLink", render: () => <StudentInternships preview/>},
        {to: "/interviews", titleKey: "home.studentInterviewsLink", render: () => <Interviews preview/>},
    ],
    EMPLOYER: [
        {
            to: "/internships",
            titleKey: "home.employerInternshipsLink",
            render: (user) => <PostInternship user={user} preview/>
        },
        {
            to: "/applications",
            titleKey: "home.employerApplicationsLink",
            render: (user) => <Applications user={user} preview/>
        },
    ],
    MANAGER: [
        {to: "/manager/cvs", titleKey: "home.managerCvLink", render: () => <ManagerCv preview/>},
        {
            to: "/manager/internships",
            titleKey: "home.managerInternshipsLink",
            render: () => <ManagerInternships preview/>
        },
        {
            to: "/employer/interviews",
            titleKey: "navbar.interviews",
            render: () => <EmployerInterviews preview/>

        }
    ],
    TEACHER: [],
};