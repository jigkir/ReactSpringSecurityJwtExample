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
import {i18nError} from "./utils/i18nError.jsx";
import StudentInternship from "./components/page/internship/StudentInternship.jsx";

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
                            localStorage.removeItem("token");
                            if (!cancelled) setUser({});
                            return;
                        case 403:
                            throw i18nError("error.accessRefused");
                        case 404:
                            throw i18nError("error.notFound");
                        default:
                            throw i18nError("error.apiStatus", {status: res.status});
                    }
                }
                const data = await res.json();
                if (!cancelled) setUser({...data, isLoggedIn: true});
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err.i18n ? err : i18nError("error.network"));
                navigate("/error");
            });

        return () => {
            cancelled = true;
        };
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
                        <Route path="/internship" element={<StudentInternship/>}/>
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
