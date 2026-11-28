


import {generatePath, Navigate, Outlet, Route, useOutletContext} from "react-router-dom";
import {ACCOUNT_STATUS} from "../utils/status/AccountStatus.js";
import Home from "../components/page/Home.jsx";
import About from "../components/page/About.jsx";
import Login from "../components/page/auth/Login.jsx";
import Signup from "../components/page/auth/Signup.jsx";
import Logout from "../components/page/auth/Logout.jsx";
import ErrorPage from "../components/page/ErrorPage.jsx";
import ExpiredUser from "../components/page/ExpiredUser.jsx";
import Users from "../components/page/manager/Users.jsx";
import Tracking from "../components/page/manager/Tracking.jsx";
import Portfolio from "../components/page/student/Portfolio.jsx";
import ContractFile from "../components/features/contracts/ContractFile.jsx";
import StudentInternships from "../components/page/student/Internships.jsx";
import StudentInterviews from "../components/page/student/Interviews.jsx";
import StudentOffers from "../components/page/student/Offers.jsx";
import StudentContracts from "../components/page/student/Contracts.jsx";
import ManagerCv from "../components/page/manager/Cvs.jsx";
import ManagerInternships from "../components/page/manager/Internships.jsx";
import ManagerContracts from "../components/page/manager/Contracts.jsx";
import ManagerStudentStatuses from "../components/page/manager/StudentStatuses.jsx";
import PostInternship from "../components/page/employer/Internships.jsx";
import Applications from "../components/page/employer/Applications.jsx";
import ViewApplications from "../components/page/employer/ApplicationsOfInternship.jsx";
import EmployerInterviews from "../components/page/employer/Interviews.jsx";
import EmployerContracts from "../components/page/employer/Contracts.jsx";
import EvaluationFile from "../components/features/evaluations/EvaluationFile.jsx";
import WorkplaceEvaluationsManager from "../components/page/manager/Evaluations.jsx";
import WorkplaceEvaluations from "../components/page/teacher/Evaluations.jsx";

export const ROLE = {
    STUDENT: "STUDENT",
    TEACHER: "TEACHER",
    EMPLOYER: "EMPLOYER",
    MANAGER: "MANAGER",
};

const ALL_ROLES = Object.values(ROLE);


export const PATHS = {

    ROOT: "/",
    ABOUT: "/about",
    LOGIN: "/login",
    SIGNUP: "/signup",
    LOGOUT: "/logout",
    ERROR: "/error",
    EXPIRED: "/expired",


    HOME: "/home",


    STUDENT_PORTFOLIO: "/student/portfolio",
    STUDENT_CV: "/student/cv",
    STUDENT_INTERNSHIPS: "/student/internship",
    STUDENT_INTERVIEWS: "/student/interviews",
    STUDENT_OFFERS: "/student/offers",
    STUDENT_CONTRACTS: "/student/contracts",
    STUDENT_CONTRACT: "/student/contracts/:id",


    TEACHER_EVALUATIONS: "/teacher/evaluations",
    TEACHER_EVALUATION: "/teacher/evaluations/:id",


    MANAGER_EVALUATIONS: "/manager/evaluations",
    MANAGER_EVALUATION: "/manager/evaluations/:id",
    MANAGER_CVS: "/manager/cvs",
    MANAGER_INTERNSHIPS: "/manager/internships",
    MANAGER_CONTRACTS: "/manager/contracts",
    MANAGER_CONTRACT: "/manager/contracts/:id",
    MANAGER_USERS: "/manager/users",
    MANAGER_TRACKING: "/manager/tracking",
    MANAGER_STUDENT_STATUSES: "/manager/student-statuses",


    EMPLOYER_INTERNSHIPS: "/employer/internships",
    EMPLOYER_APPLICATIONS: "/employer/applications",
    EMPLOYER_APPLICATION: "/employer/applications/:id",
    EMPLOYER_INTERVIEWS: "/employer/interviews",
    EMPLOYER_CONTRACTS: "/employer/contracts",
    EMPLOYER_CONTRACT: "/employer/contracts/:id",


    NOT_FOUND: "*",
};


export const employerApplicationPath = (internshipId) =>
    generatePath(PATHS.EMPLOYER_APPLICATION, {id: internshipId});


export const contractFilePath = (pattern, contractId) => generatePath(pattern, {id: contractId});
export const evaluationFilePath = (pattern, evaluationId) => generatePath(pattern, {id: evaluationId});



export const ROUTES = [

    {path: PATHS.ROOT, element: () => <Home/>},
    {path: PATHS.ABOUT, element: () => <About/>},
    {path: PATHS.LOGIN, element: ({user, setError}) => <Login user={user} setError={setError}/>},
    {path: PATHS.SIGNUP, element: () => <Signup/>},
    {path: PATHS.LOGOUT, element: ({setUser}) => <Logout setUser={setUser}/>},
    {path: PATHS.ERROR, element: ({error}) => <ErrorPage error={error}/>},
    {path: PATHS.EXPIRED, element: ({user}) => <ExpiredUser user={user}/>},


    {path: PATHS.HOME, roles: ALL_ROLES, element: () => <Home/>},


    {
        path: PATHS.STUDENT_PORTFOLIO, roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.portfolio"},
        home: [ROLE.STUDENT],
        element: () => <Portfolio/>
    },
    {
        path: PATHS.STUDENT_CV, roles: [ROLE.STUDENT],
        element: () => <Navigate to={PATHS.STUDENT_PORTFOLIO} replace/>
    },
    {
        path: PATHS.STUDENT_INTERNSHIPS, roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.internships"},
        home: [ROLE.STUDENT],
        element: () => <StudentInternships/>
    },
    {
        path: PATHS.STUDENT_INTERVIEWS, roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.interviews"},
        home: [ROLE.STUDENT],
        element: () => <StudentInterviews/>
    },
    {
        path: PATHS.STUDENT_OFFERS, roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.offers"}, home: [ROLE.STUDENT],
        element: () => <StudentOffers/>
    },
    {
        path: PATHS.STUDENT_CONTRACTS, roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.contracts"},
        home: [ROLE.STUDENT],
        element: () => <StudentContracts/>
    },
    {path: PATHS.STUDENT_CONTRACT, roles: [ROLE.STUDENT], element: () => <ContractFile/>},


    {
        path: PATHS.TEACHER_EVALUATIONS, roles: [ROLE.TEACHER], nav: {TEACHER: "navbar.evaluations"},
        home: [ROLE.TEACHER],
        element: () => <WorkplaceEvaluations/>
    },
    {path: PATHS.TEACHER_EVALUATION, roles: [ROLE.TEACHER], element: () => <EvaluationFile/>},


    {
        path: PATHS.MANAGER_CVS, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.cv"}, home: [ROLE.MANAGER],
        element: () => <ManagerCv/>
    },
    {
        path: PATHS.MANAGER_INTERNSHIPS, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.internships"},
        home: [ROLE.MANAGER],
        element: () => <ManagerInternships/>
    },
    {
        path: PATHS.MANAGER_CONTRACTS, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.contracts"},
        home: [ROLE.MANAGER],
        element: () => <ManagerContracts/>
    },
    {path: PATHS.MANAGER_CONTRACT, roles: [ROLE.MANAGER], element: () => <ContractFile/>},
    {
        path: PATHS.MANAGER_EVALUATIONS, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.evaluations"},
        home: [ROLE.MANAGER],
        element: () => <WorkplaceEvaluationsManager/>
    },
    {path: PATHS.MANAGER_EVALUATION, roles: [ROLE.MANAGER], element: () => <EvaluationFile/>},
    {
        path: PATHS.MANAGER_USERS, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.users"}, home: [ROLE.MANAGER],
        element: ({user}) => <Users user={user}/>
    },
    {
        path: PATHS.MANAGER_TRACKING, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.tracking"},
        home: [ROLE.MANAGER],
        element: () => <Tracking/>
    },
    {
        path: PATHS.MANAGER_STUDENT_STATUSES, roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.studentStatuses"},
        home: [ROLE.MANAGER],
        element: () => <ManagerStudentStatuses/>
    },


    {
        path: PATHS.EMPLOYER_INTERNSHIPS, roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.postInternship"},
        home: [ROLE.EMPLOYER],
        element: ({user}) => <PostInternship user={user}/>
    },
    {
        path: PATHS.EMPLOYER_APPLICATIONS, roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.applications"},
        home: [ROLE.EMPLOYER],
        element: ({user}) => <Applications user={user}/>
    },
    {
        path: PATHS.EMPLOYER_APPLICATION, roles: [ROLE.EMPLOYER],
        element: ({user}) => <ViewApplications user={user}/>
    },
    {
        path: PATHS.EMPLOYER_INTERVIEWS, roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.interviews"},
        home: [ROLE.EMPLOYER],
        element: ({user}) => <EmployerInterviews user={user}/>
    },
    {
        path: PATHS.EMPLOYER_CONTRACTS, roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.contracts"},
        home: [ROLE.EMPLOYER],
        element: () => <EmployerContracts/>
    },
    {path: PATHS.EMPLOYER_CONTRACT, roles: [ROLE.EMPLOYER], element: () => <ContractFile/>},


    {path: PATHS.NOT_FOUND, element: () => <Navigate to={PATHS.ROOT} replace/>},
];





function RequireRole({user, roles}) {
    const ctx = useOutletContext();

    if (!localStorage.getItem("token")) return <Navigate to={PATHS.LOGIN} replace/>;
    if (user?.isLoggedIn === undefined) return <div aria-busy="true"/>;
    if (!user.isLoggedIn) return <Navigate to={PATHS.LOGIN} replace/>;

    const role = (user.role ?? "").toString().replace("ROLE_", "");
    if (!roles.includes(role)) return <Navigate to={PATHS.HOME} replace/>;

    if (ctx.accountStatus === null) return <div aria-busy="true"/>;
    if (ctx.accountStatus !== ACCOUNT_STATUS.APPROVED) return <Navigate to={PATHS.EXPIRED} replace/>;

    return <Outlet context={ctx}/>;
}





export const getNavLinks = (role) =>
    ROUTES
        .filter((route) => route.nav?.[role])
        .map((route) => ({to: route.path, labelKey: route.nav[role]}));





export function appRoutes(ctx) {
    const renderRoute = (route) => <Route key={route.path} path={route.path} element={route.element(ctx)}/>;

    const publicRoutes = ROUTES.filter((route) => !route.roles);


    const guarded = new Map();
    for (const route of ROUTES.filter((r) => r.roles)) {
        const key = route.roles.join(",");
        if (!guarded.has(key)) guarded.set(key, {roles: route.roles, routes: []});
        guarded.get(key).routes.push(route);
    }

    return (
        <>
            {publicRoutes.map(renderRoute)}
            {[...guarded.entries()].map(([key, group]) => (
                <Route key={key} element={<RequireRole user={ctx.user} roles={group.roles}/>}>
                    {group.routes.map(renderRoute)}
                </Route>
            ))}
        </>
    );
}
