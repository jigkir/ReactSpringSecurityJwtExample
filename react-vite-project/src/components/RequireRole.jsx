import {Navigate, Outlet, useOutletContext} from 'react-router-dom';

/**
 * Layout route: renders children only if the user has one of `roles`.
 *   not logged in     → /login
 *   still loading     → blank (avoids a redirect flash)
 *   wrong role        → /home
 * The backend still enforces access; this is UX only.
 *
 * IMPORTANT: it forwards PageLayout's outlet context ({dark, user}) to the
 * child routes. Without `context={ctx}`, children calling useOutletContext()
 * get `undefined` and crash.
 */
export default function RequireRole({user, roles}) {
    const ctx = useOutletContext();

    if (!localStorage.getItem("token")) return <Navigate to="/login" replace/>;
    if (user?.isLoggedIn === undefined) return <div aria-busy="true"/>;
    if (!user.isLoggedIn) return <Navigate to="/login" replace/>;

    const role = (user.role ?? "").toString().replace("ROLE_", "");
    if (!roles.includes(role)) return <Navigate to="/home" replace/>;

    return <Outlet context={ctx}/>;
}