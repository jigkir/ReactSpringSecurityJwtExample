import {useCallback, useEffect, useState} from 'react';
import {Navigate, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {useDarkMode} from './styles/DarkMode.jsx';
import PageLayout from './components/PageLayout.jsx';
import About from './components/About.jsx';
import Login from './components/page/auth/Login.jsx';
import Signup from './components/page/auth/Signup.jsx';
import {checkUserStatus, getCurrentUser} from './components/api/Api.jsx';
import ErrorPage from './components/ErrorPage.jsx';
import Logout from './components/page/auth/Logout.jsx';
import PostInternship from './components/page/employer/internship/PostInternship.jsx';
import Home from './components/Home.jsx';
import Portfolio from './components/page/portfolio/Portfolio.jsx';
import ManagerCv from './components/page/manager/Cv.jsx';
import ManagerInternships from './components/page/manager/Internships.jsx';
import RequireRole from "./components/RequireRole.jsx";
import {i18nError} from "./utils/i18nError.jsx";
import StudentInternships from "./components/page/student/Internships.jsx";
import ViewApplications from "./components/page/employer/application/ViewApplications.jsx";
import Applications from "./components/page/employer/application/Applications.jsx";
import Interviews from "./components/page/student/Interviews.jsx";
import Offers from "./components/page/student/Offers.jsx";
import ExpiredUser from "./components/page/ExpiredUser.jsx";
import {usePolling} from "./utils/usePolling.js";
import {SessionProvider} from "./utils/SessionContext.jsx";
import Users from "./components/page/Users.jsx";
import EmployerInterviews from "./components/page/employer/interview/EmployerInterviews.jsx";

function App() {
    const [user, setUser] = useState({});
    const [error, setError] = useState(null);
    const [accountStatus, setAccountStatus] = useState(null);
    const {dark, toggleDark} = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();

    const clearSession = useCallback(() => {
        localStorage.removeItem("token");
        setUser({});
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser({});
            return;
        }

        let cancelled = false;

        getCurrentUser()
            .then((data) => {
                if (!cancelled) setUser({...data, isLoggedIn: true});
            })
            .catch((err) => {
                if (cancelled) return;
                if (err.status === 401) {
                    clearSession();
                    return;
                }
                if (err.status === 403) setError(i18nError("error.accessRefused"));
                else if (err.status === 404) setError(i18nError("error.notFound"));
                else if (err.status) setError(i18nError("error.apiStatus", {status: err.status}));
                else setError(i18nError("error.network"));
                navigate("/error");
            });

        return () => {
            cancelled = true;
        };
    }, [location.pathname]);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await checkUserStatus();
            setAccountStatus(data.status);
        } catch (err) {
            if (err.status === 401) clearSession();
        }
    }, [clearSession]);

    // Reload the status whenever another user logs in
    useEffect(() => {
        setAccountStatus(null);
        if (user?.email) void fetchStatus();
    }, [user?.email, fetchStatus]);

    // Keep checking until access is granted: the manager can still reactivate a refused account
    usePolling(fetchStatus, Boolean(user?.email));

    return (
        <SessionProvider userId={user?.isLoggedIn ? user.id : null}>
            <div className={`${dark ? "app-dark" : "app-light"} flex flex-col min-h-dvh`}>
                <Routes>
                    <Route element={<PageLayout user={user} accountStatus={accountStatus} dark={dark}
                                                toggleDark={toggleDark}/>}>

                        {/* Public: Home shows the landing page when logged out, the role home when logged in */}
                        <Route path="/" element={<Home/>}/>
                        <Route path="/about" element={<About/>}/>
                        <Route path="/login" element={<Login user={user} setError={setError}/>}/>
                        <Route path="/signup" element={<Signup/>}/>
                        <Route path="/logout" element={<Logout setUser={setUser}/>}/>
                        <Route path="/error" element={<ErrorPage error={error}/>}/>

                        {/* Any logged-in role */}
                        <Route
                            element={<RequireRole user={user} roles={["STUDENT", "TEACHER", "EMPLOYER", "MANAGER"]}/>}>
                            <Route path="/home" element={<Home/>}/>
                        </Route>

                        {/* Student */}
                        <Route element={<RequireRole user={user} roles={["STUDENT"]}/>}>
                            <Route path="/portfolio" element={<Portfolio/>}/>
                            <Route path="/cv" element={<Navigate to="/portfolio" replace/>}/>
                            <Route path="/internship" element={<StudentInternships/>}/>
                            <Route path="/interviews" element={<Interviews/>}/>
                            <Route path="/offers" element={<Offers/>}/>
                        </Route>

                        {/* Manager */}
                        <Route element={<RequireRole user={user} roles={["MANAGER"]}/>}>
                            <Route path="/manager/cvs" element={<ManagerCv/>}/>
                            <Route path="/manager/internships" element={<ManagerInternships/>}/>
                            <Route path="/users" element={<Users user={user}/>}/>
                        </Route>

                        {/* Employer */}
                        <Route element={<RequireRole user={user} roles={["EMPLOYER"]}/>}>
                            <Route path="/internships" element={<PostInternship user={user}/>}/>
                            <Route path="/applications" element={<Applications user={user}/>}/>
                            <Route path="/application/:id" element={<ViewApplications user={user}/>}/>
                            <Route path="/employer/interviews" element={<EmployerInterviews user={user}/>}/>
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace/>}/>
                        <Route path="/expired" element={<ExpiredUser user={user}/>}/>
                    </Route>
                </Routes>
            </div>
        </SessionProvider>
    );
}

export default App;