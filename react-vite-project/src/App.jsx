import {useEffect, useState} from 'react';
import {Navigate, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {useDarkMode} from './styles/DarkMode.jsx';
import PageLayout from './components/PageLayout.jsx';
import MainContainer from './components/MainContainer.jsx';
import About from './components/About.jsx';
import Login from './components/page/auth/Login.jsx';
import Signup from './components/page/auth/Signup.jsx';
import fetcher from './utils/fetcher.js';
import ErrorPage from './components/ErrorPage.jsx';
import Logout from './components/page/auth/Logout.jsx';
import PostInternship from './components/page/internship/PostInternship.jsx';
import Home from './components/page/Home.jsx';
import StudentCv from './components/page/student/Cv.jsx';
import ManagerCv from './components/page/manager/Cv.jsx';
import RequireRole from "./components/RequireRole.jsx";

function LandingRoute({user}) {
    if (user?.isLoggedIn) return <Navigate to="/home" replace/>;
    if (localStorage.getItem("token") && user?.isLoggedIn === undefined) return <div aria-busy="true"/>;
    return <MainContainer/>;
}

function App() {
    const [user, setUser] = useState({});
    const [error, setError] = useState(null);
    const {dark, toggleDark} = useDarkMode();
    const navigate = useNavigate();
    // Tracks the current route so the auth-check effect below can re-run
    // on every navigation (e.g. right after login redirects), instead of
    // only once when App first mounts.
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser({});
            return;
        }

        let cancelled = false;

        fetcher("users/current", {})
            .then(async (res) => {
                if (!res.ok) {
                    switch (res.status) {
                        case 401:
                            localStorage.clear();
                            if (!cancelled) setUser({});
                            return;
                        case 403:
                            throw new Error("Forbidden");
                        case 404:
                            throw new Error("Nothing here 404");
                        default:
                            throw new Error(`Erreur API (${res.status})`);
                    }
                }
                const data = await res.json();
                if (!cancelled) setUser({...data, isLoggedIn: true});
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err);
                navigate("/error");
            });

        return () => {
            cancelled = true;
        };
        // Re-run on every navigation so state updates right after login/logout, not just once on mount.
    }, [location.pathname]);

    return (
        <div className={`${dark ? "app-dark" : "app-light"} flex flex-col min-h-screen`}>
            <Routes>
                <Route element={<PageLayout user={user} dark={dark} toggleDark={toggleDark}/>}>

                    {/* Public */}
                    <Route path="/" element={<LandingRoute user={user}/>}/>
                    <Route path="/about" element={<About/>}/>
                    <Route path="/login" element={<Login user={user} setError={setError}/>}/>
                    <Route path="/signup" element={<Signup/>}/>
                    <Route path="/logout" element={<Logout setUser={setUser}/>}/>
                    <Route path="/error" element={<ErrorPage error={error}/>}/>

                    {/* Any logged-in role */}
                    <Route element={<RequireRole user={user} roles={["STUDENT", "TEACHER", "EMPLOYER", "MANAGER"]}/>}>
                        <Route path="/home" element={<Home/>}/>
                    </Route>

                    {/* Student */}
                    <Route element={<RequireRole user={user} roles={["STUDENT"]}/>}>
                        <Route path="/cv" element={<StudentCv user={user}/>}/>
                    </Route>

                    {/* Manager */}
                    <Route element={<RequireRole user={user} roles={["MANAGER"]}/>}>
                        <Route path="/manager/cvs" element={<ManagerCv/>}/>
                    </Route>

                    {/* Employer */}
                    <Route element={<RequireRole user={user} roles={["EMPLOYER"]}/>}>
                        <Route path="/post" element={<PostInternship user={user}/>}/>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Route>
            </Routes>
        </div>
    );
}

export default App;
