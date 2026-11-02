import {Outlet} from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import {DevModeToggle} from './dev/DevMode.jsx';
import {NotificationsProvider} from './notification/NotificationsProvider.jsx';

function PageLayout({user, accountStatus, dark, toggleDark}) {
    return (
        <NotificationsProvider user={user}>
            <div className="flex flex-col flex-1">
                <Navbar user={user} accountStatus={accountStatus} dark={dark} toggleDark={toggleDark}/>
                <Outlet context={{dark, user, accountStatus}}/>
                <Footer dark={dark}/>
                <DevModeToggle dark={dark}/>
            </div>
        </NotificationsProvider>
    );
}

export default PageLayout;