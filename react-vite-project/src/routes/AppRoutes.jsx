/**
 * AppRoutes.jsx — THE single place where routes are declared.
 * Location: src/routes/AppRoutes.jsx
 *
 * Each entry of ROUTES describes ONE page:
 *   path     URL of the page
 *   element  (ctx) => JSX      ctx = {user, setUser, setError, error}
 *   roles    optional          roles allowed (guarded by <RequireRole/>). No `roles` = public page.
 *   nav      optional          {ROLE: "translation.key"} -> the page shows up in the navbar of that role.
 *                              The ORDER of ROUTES is the order of the navbar links.
 *
 * App.jsx    -> <Route element={<PageLayout/>}>{appRoutes(ctx)}</Route>
 * Navbar.jsx -> getNavLinks(role)
 *
 * To add a page: add ONE line here. Nothing to change in App.jsx or Navbar.jsx.
 */

import {Navigate, Outlet, Route, useOutletContext} from 'react-router-dom';
import {ACCOUNT_STATUS} from '../utils/AccountStatus.js';
import Home from '../components/Home.jsx';
import About from '../components/About.jsx';
import Login from '../components/page/auth/Login.jsx';
import Signup from '../components/page/auth/Signup.jsx';
import Logout from '../components/page/auth/Logout.jsx';
import ErrorPage from '../components/ErrorPage.jsx';
import ExpiredUser from '../components/page/ExpiredUser.jsx';
import Users from '../components/page/Users.jsx';
import Tracking from '../components/page/Tracking.jsx';
import WorkplaceEvaluations from '../components/page/WorkplaceEvaluations.jsx';
import Portfolio from '../components/page/portfolio/Portfolio.jsx';
import ContractFile from '../components/contracts/ContractFile.jsx';
import StudentInternships from '../components/page/student/Internships.jsx';
import StudentInterviews from '../components/page/student/Interviews.jsx';
import StudentOffers from '../components/page/student/Offers.jsx';
import StudentContracts from '../components/page/student/contracts/Contracts.jsx';
import ManagerCv from '../components/page/manager/Cv.jsx';
import ManagerInternships from '../components/page/manager/Internships.jsx';
import ManagerContracts from '../components/page/manager/Contracts.jsx';
import ManagerStudentStatuses from '../components/page/manager/StudentStatuses.jsx';
import PostInternship from '../components/page/employer/internship/PostInternship.jsx';
import Applications from '../components/page/employer/application/Applications.jsx';
import ViewApplications from '../components/page/employer/application/ViewApplications.jsx';
import EmployerInterviews from '../components/page/employer/interview/EmployerInterviews.jsx';
import EmployerContracts from '../components/page/employer/contracts/Contracts.jsx';

export const ROLE = {
    STUDENT: "STUDENT",
    TEACHER: "TEACHER",
    EMPLOYER: "EMPLOYER",
    MANAGER: "MANAGER",
};

const ALL_ROLES = Object.values(ROLE);

// region The routes (order = order of the navbar links)
export const ROUTES = [
    // ───────── Public ─────────
    {path: "/", element: () => <Home/>},
    {path: "/about", element: () => <About/>},
    {path: "/login", element: ({user, setError}) => <Login user={user} setError={setError}/>},
    {path: "/signup", element: () => <Signup/>},
    {path: "/logout", element: ({setUser}) => <Logout setUser={setUser}/>},
    {path: "/error", element: ({error}) => <ErrorPage error={error}/>},
    {path: "/expired", element: ({user}) => <ExpiredUser user={user}/>},
    // Not guarded (same as before)
    {path: "/evaluations", element: () => <WorkplaceEvaluations/>},

    // ───────── Any logged-in role ─────────
    {path: "/home", roles: ALL_ROLES, element: () => <Home/>},

    // ───────── Student ─────────
    {
        path: "/portfolio", roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.portfolio"},
        element: () => <Portfolio/>
    },
    {path: "/cv", roles: [ROLE.STUDENT], element: () => <Navigate to="/portfolio" replace/>},
    {
        path: "/internship", roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.internships"},
        element: () => <StudentInternships/>
    },
    {
        path: "/interviews", roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.interviews"},
        element: () => <StudentInterviews/>
    },
    {
        path: "/offers", roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.offers"},
        element: () => <StudentOffers/>
    },
    {
        path: "/student/contracts", roles: [ROLE.STUDENT], nav: {STUDENT: "navbar.contracts"},
        element: () => <StudentContracts/>
    },
    {path: "/student/contracts/:id", roles: [ROLE.STUDENT], element: () => <ContractFile/>},

    // ───────── Manager ─────────
    {
        path: "/manager/cvs", roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.cv"},
        element: () => <ManagerCv/>
    },
    {
        path: "/manager/internships", roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.internships"},
        element: () => <ManagerInternships/>
    },
    {
        path: "/manager/contracts", roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.contracts"},
        element: () => <ManagerContracts/>
    },
    {path: "/manager/contracts/:id", roles: [ROLE.MANAGER], element: () => <ContractFile/>},
    {
        path: "/users", roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.users"},
        element: ({user}) => <Users user={user}/>
    },
    {
        path: "/tracking", roles: [ROLE.MANAGER], nav: {MANAGER: "navbar.tracking"},
        element: () => <Tracking/>
    },
    {
        path: "/manager/student-statuses",
        roles: [ROLE.MANAGER],
        nav: {MANAGER: "navbar.studentStatuses"},
        element: () => <ManagerStudentStatuses/>
    },

    // ───────── Employer ─────────
    {
        path: "/internships", roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.postInternship"},
        element: ({user}) => <PostInternship user={user}/>
    },
    {
        path: "/applications", roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.applications"},
        element: ({user}) => <Applications user={user}/>
    },
    {
        path: "/applications/:id", roles: [ROLE.EMPLOYER],
        element: ({user}) => <ViewApplications user={user}/>
    },
    {
        path: "/employer/interviews", roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.interviews"},
        element: ({user}) => <EmployerInterviews user={user}/>
    },
    {
        path: "/employer/contracts", roles: [ROLE.EMPLOYER], nav: {EMPLOYER: "navbar.contracts"},
        element: () => <EmployerContracts/>
    },
    {path: "/employer/contracts/:id", roles: [ROLE.EMPLOYER], element: () => <ContractFile/>},

    // ───────── Anything else ─────────
    {path: "*", element: () => <Navigate to="/" replace/>},
];
// endregion

// region Role guard
/**
 * Layout route: renders its children only if the user has one of `roles`.
 *   no token          → /login
 *   still loading     → blank (avoids a redirect flash)
 *   not logged in     → /login
 *   wrong role        → /home
 *   access not active → /expired
 * The backend still enforces access; this is UX only.
 *
 * It forwards PageLayout's outlet context ({dark, user, accountStatus}) to the child routes:
 * without `context={ctx}`, children calling useOutletContext() would get `undefined`.
 */
function RequireRole({user, roles}) {
    const ctx = useOutletContext();

    if (!localStorage.getItem("token")) return <Navigate to="/login" replace/>;
    if (user?.isLoggedIn === undefined) return <div aria-busy="true"/>;
    if (!user.isLoggedIn) return <Navigate to="/login" replace/>;

    const role = (user.role ?? "").toString().replace("ROLE_", "");
    if (!roles.includes(role)) return <Navigate to="/home" replace/>;

    if (ctx.accountStatus === null) return <div aria-busy="true"/>;
    if (ctx.accountStatus !== ACCOUNT_STATUS.APPROVED) return <Navigate to="/expired" replace/>;

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