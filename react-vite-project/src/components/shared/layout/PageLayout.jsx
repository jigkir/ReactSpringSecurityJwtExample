import {Outlet, useLocation} from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import {DevModeToggle} from "../core/dev/DevMode.jsx";
import {NotificationsProvider} from "../notification/NotificationsProvider.jsx";
import {useEffect} from "react";

function PageLayout({user, accountStatus, dark, toggleDark}) {
    const {pathname} = useLocation();


    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <NotificationsProvider user={user} accountStatus={accountStatus}>
            <div className="flex flex-col flex-1 w-full min-w-0 max-w-full">
                <Navbar user={user} accountStatus={accountStatus} dark={dark} toggleDark={toggleDark}/>
                <Outlet context={{dark, user, accountStatus}}/>
                <Footer dark={dark}/>
                <DevModeToggle dark={dark}/>
            </div>
        </NotificationsProvider>
    );
}

export default PageLayout;
