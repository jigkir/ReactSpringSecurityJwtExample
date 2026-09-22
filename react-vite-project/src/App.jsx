import {useEffect, useState} from "react";
import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {useDarkMode} from "./styles/DarkMode.jsx";
import PageLayout from "./components/PageLayout.jsx";
import MainContainer from "./components/MainContainer.jsx";
import About from "./components/About.jsx";
import Login from "./components/page/auth/Login.jsx";
import Signup from "./components/page/auth/Signup.jsx";
import fetcher from "./utils/fetcher.js";
import ErrorPage from "./components/ErrorPage.jsx";
import Logout from "./components/page/auth/Logout.jsx";
import EmprunteurHome from "./components/page/EmprunteurHome.jsx";
import PreposeHome from "./components/page/PreposeHome.jsx";
import GestionnaireHome from "./components/page/GestionnaireHome.jsx";
import Home from "./components/page/Home.jsx";

import PostInternship from "./components/page/PostInternship.jsx";
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
        const token = localStorage.getItem('token');
        if (!token) {
            setUser({});
            return;
        }

        let cancelled = false;

        fetcher('users/current', {})
            .then(async (res) => {
                if (!res.ok) {
                    switch (res.status) {
                        case 401:
                            localStorage.clear();
                            if (!cancelled) setUser({});
                            return;
                        case 403:
                            throw new Error('Forbidden');
                        case 404:
                            throw new Error('Nothing here 404');
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
                navigate('/error');
            });

        return () => {
            cancelled = true;
        };
        // Re-run on every navigation so state updates right after login/logout, not just once on mount.
    }, [location.pathname]);

    return (
        <div className={`${dark ? 'app-dark' : 'app-light'} flex flex-col min-h-screen`}>
            <Routes>
                <Route path="/" element={<PageLayout user={user} dark={dark} toggleDark={toggleDark}/>}>
                    <Route index element={<MainContainer setError={setError}/>}/>
                    <Route path="about" element={<About/>}/>
                    <Route path="login" element={<Login user={user} setError={setError}/>}/>
                    <Route path="signup" element={<Signup/>}/>
                    <Route path="home" element={<Home user={user}/>}/>
                    <Route path="logout" element={<Logout setUser={setUser}/>}/>
                    <Route path="emprunteur" element={<EmprunteurHome/>}/>
                    <Route path="prepose" element={<PreposeHome/>}/>
                    <Route path='post' element={<PostInternship user={user}/>}/>
                    <Route path="gestionnaire" element={<GestionnaireHome/>}/>
                    <Route path="error" element={<ErrorPage error={error}/>}/>
                </Route>
            </Routes>
        </div>
    );
}

export default App;
