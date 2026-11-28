/**
 * AppRoutes.jsx — THE single place where routes AND their URLs are declared.
 * Location: src/routes/AppRoutes.jsx
 *
 * PATHS holds every URL of the app. No other file writes a route as a string:
 * links, navigate(), <Navigate/>, notifications and Home cards all use PATHS.
 *
 * Each entry of ROUTES describes ONE page:
 *   path     URL of the page (always a PATHS value)
 *   element  (ctx) => JSX      ctx = {user, setUser, setError, error}
 *   roles    optional          roles allowed (guarded by <RequireRole/>). No `roles` = public page.
 *   nav      optional          {ROLE: "translation.key"} -> the page shows up in the navbar of that role.
 *                              The ORDER of ROUTES is the order of the navbar links.
 *   home     optional          [ROLE] -> the page gets a card on the Home of that role
 *                              (its config lives in components/home/HomeSections.js, keyed by `path`).
 *
 * App.jsx    -> <Route element={<PageLayout/>}>{appRoutes(ctx)}</Route>
 * Navbar.jsx -> getNavLinks(role)
 *
 * To add a page: add its URL to PATHS, then ONE line in ROUTES. Nothing to change in App.jsx or Navbar.jsx.
 * If the page has a Home card, also add its entry in HomeSections.js (same path),
 * and if it has notifications, its entry in NotificationsProvider.jsx.
 *
 * IMPORTANT: this file imports the pages, and the pages import PATHS from here (a cycle).
 * So PATHS must only be READ when a function or component runs, never at the top level of a
 * module (no `const X = PATHS.FOO;` outside a function): at load time it does not exist yet.
 */

import {generatePath, Navigate, Outlet, Route, useOutletContext} from "react-router-dom";
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import Home from "../components/Home.jsx";
import About from "../components/About.jsx";
import Login from "../components/page/auth/Login.jsx";
import Signup from "../components/page/auth/Signup.jsx";
import Logout from "../components/page/auth/Logout.jsx";
import ErrorPage from "../components/ErrorPage.jsx";
import ExpiredUser from "../components/page/ExpiredUser.jsx";
import Users from "../components/page/manager/Users.jsx";
import Tracking from "../components/page/manager/Tracking.jsx";
import Portfolio from "../components/page/portfolio/Portfolio.jsx";
import ContractFile from "../components/contracts/ContractFile.jsx";
import StudentInternships from "../components/page/student/Internships.jsx";
import StudentInterviews from "../components/page/student/Interviews.jsx";
import StudentOffers from "../components/page/student/Offers.jsx";
import StudentContracts from "../components/page/student/contracts/Contracts.jsx";
import ManagerCv from "../components/page/manager/Cv.jsx";
import ManagerInternships from "../components/page/manager/Internships.jsx";
import ManagerContracts from "../components/page/manager/Contracts.jsx";
import ManagerStudentStatuses from "../components/page/manager/StudentStatuses.jsx";
import PostInternship from "../components/page/employer/Internships.jsx";
import Applications from "../components/page/employer/Applications.jsx";
import ViewApplications from "../components/page/employer/ApplicationsOfInternship.jsx";
import EmployerInterviews from "../components/page/employer/Interviews.jsx";
import EmployerContracts from "../components/page/employer/contracts/Contracts.jsx";
import EvaluationFile from "../components/evaluations/EvaluationFile.jsx";
import WorkplaceEvaluationsManager from "../components/page/manager/Evaluations.jsx";
import WorkplaceEvaluations from "../components/page/teacher/Evaluations.jsx";

export const ROLE = {
    STUDENT: "STUDENT",
    TEACHER: "TEACHER",
    EMPLOYER: "EMPLOYER",
    MANAGER: "MANAGER",
};

const ALL_ROLES = Object.values(ROLE);

// region The URLs: the only place where a route is written as a string
export const PATHS = {
    // Public
    ROOT: "/",
    ABOUT: "/about",
    LOGIN: "/login",
    SIGNUP: "/signup",
    LOGOUT: "/logout",
    ERROR: "/error",
    EXPIRED: "/expired",

    // Any logged-in role
    HOME: "/home",

    // Student
    STUDENT_PORTFOLIO: "/student/portfolio",
    STUDENT_CV: "/student/cv",
    STUDENT_INTERNSHIPS: "/student/internship",
    STUDENT_INTERVIEWS: "/student/interviews",
    STUDENT_OFFERS: "/student/offers",
    STUDENT_CONTRACTS: "/student/contracts",
    STUDENT_CONTRACT: "/student/contracts/:id",

    // Teacher
    TEACHER_EVALUATIONS: "/teacher/evaluations",
    TEACHER_EVALUATION: "/teacher/evaluations/:id",

    // Manager
    MANAGER_EVALUATIONS: "/manager/evaluations",
    MANAGER_EVALUATION: "/manager/evaluations/:id",
    MANAGER_CVS: "/manager/cvs",
    MANAGER_INTERNSHIPS: "/manager/internships",
    MANAGER_CONTRACTS: "/manager/contracts",
    MANAGER_CONTRACT: "/manager/contracts/:id",
    MANAGER_USERS: "/manager/users",
    MANAGER_TRACKING: "/manager/tracking",
    MANAGER_STUDENT_STATUSES: "/manager/student-statuses",

    // Employer
    EMPLOYER_INTERNSHIPS: "/employer/internships",
    EMPLOYER_APPLICATIONS: "/employer/applications",
    EMPLOYER_APPLICATION: "/employer/applications/:id",
    EMPLOYER_INTERVIEWS: "/employer/interviews",
    EMPLOYER_CONTRACTS: "/employer/contracts",
    EMPLOYER_CONTRACT: "/employer/contracts/:id",

    // Anything else
    NOT_FOUND: "*",
};

/** "/employer/applications/12": the applications of one internship offer. */
export const employerApplicationPath = (internshipId) =>
    generatePath(PATHS.EMPLOYER_APPLICATION, {id: internshipId});

/** URL of a contract page from a pattern of PATHS (STUDENT_CONTRACT, MANAGER_CONTRACT, EMPLOYER_CONTRACT). */
export const contractFilePath = (pattern, contractId) => generatePath(pattern, {id: contractId});
export const evaluationFilePath = (pattern, evaluationId) => generatePath(pattern, {id: evaluationId});
// endregion

// region The routes (order = order of the navbar links)
export const ROUTES = [
    // ───────── Public ─────────
    {path: PATHS.ROOT, element: () => <Home/>},
    {path: PATHS.ABOUT, element: () => <About/>},
    {path: PATHS.LOGIN, element: ({user, setError}) => <Login user={user} setError={setError}/>},
    {path: PATHS.SIGNUP, element: () => <Signup/>},
    {path: PATHS.LOGOUT, element: ({setUser}) => <Logout setUser={setUser}/>},
    {path: PATHS.ERROR, element: ({error}) => <ErrorPage error={error}/>},
    {path: PATHS.EXPIRED, element: ({user}) => <ExpiredUser user={user}/>},

    // ───────── Any logged-in role ─────────
    {path: PATHS.HOME, roles: ALL_ROLES, element: () => <Home/>},

    // ───────── Student ─────────
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

    // ───────── Teacher ─────────
    {
        path: PATHS.TEACHER_EVALUATIONS, roles: [ROLE.TEACHER], nav: {TEACHER: "navbar.evaluations"},
        home: [ROLE.TEACHER],
        element: () => <WorkplaceEvaluations/>
    },
    {path: PATHS.TEACHER_EVALUATION, roles: [ROLE.TEACHER], element: () => <EvaluationFile/>},

    // ───────── Manager ─────────
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

    // ───────── Employer ─────────
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

    // ───────── Anything else ─────────
    {path: PATHS.NOT_FOUND, element: () => <Navigate to={PATHS.ROOT} replace/>},
];
// endregion

// region Role guard
/**
 * Layout route: renders its children only if the user has one of `roles`.
 *   no token          → PATHS.LOGIN
 *   still loading     → blank (avoids a redirect flash)
 *   not logged in     → PATHS.LOGIN
 *   wrong role        → PATHS.HOME
 *   access not active → PATHS.EXPIRED
 * The backend still enforces access; this is UX only.
 *
 * It forwards PageLayout's outlet context ({dark, user, accountStatus}) to the child routes:
 * without `context={ctx}`, children calling useOutletContext() would get `undefined`.
 */
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

// endregion

// region Navbar links
/** [{to, labelKey}] of the role, in the order of ROUTES. */
export const getNavLinks = (role) =>
    ROUTES
        .filter((route) => route.nav?.[role])
        .map((route) => ({to: route.path, labelKey: route.nav[role]}));
// endregion

// region Router
/**
 * The <Route> tree for <Routes>. Public routes first, then one <RequireRole> group per set of roles.
 * `ctx` = {user, setUser, setError, error}
 */
export function appRoutes(ctx) {
    const renderRoute = (route) => <Route key={route.path} path={route.path} element={route.element(ctx)}/>;

    const publicRoutes = ROUTES.filter((route) => !route.roles);

    // Group the guarded routes by their roles (insertion order is kept)
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

// endregion