import {useCallback, useEffect, useState} from "react";
import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {useDarkMode} from "./styles/DarkMode.jsx";
import PageLayout from "./components/shared/layout/PageLayout.jsx";
import {checkUserStatus, getCurrentUser} from "./components/shared/core/api/Api.jsx";
import {i18nError} from "./utils/i18nError.jsx";
import {usePolling} from "./utils/usePolling.js";
import {SessionProvider} from "./utils/SessionContext.jsx";
import {appRoutes, PATHS} from "./routes/AppRoutes.jsx";

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
                navigate(PATHS.ERROR);
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
            <div className={`${dark ? "app-dark" : "app-light"} flex flex-col min-h-dvh w-full min-w-0 max-w-full`}>
                <Routes>
                    <Route element={<PageLayout user={user} accountStatus={accountStatus} dark={dark}
                                                toggleDark={toggleDark}/>}>
                        {/* Every route lives in routes/AppRoutes.jsx */}
                        {appRoutes({user, setUser, setError, error})}
                    </Route>
                </Routes>
            </div>
        </SessionProvider>
    );
}

export default App;