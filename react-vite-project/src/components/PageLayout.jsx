import {Outlet} from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import {NotificationsProvider} from './notification/Notificationsprovider.jsx';

function PageLayout({user, dark, toggleDark}) {
    return (
        <NotificationsProvider user={user}>
            <div className="flex flex-col flex-1">
                <Navbar user={user} dark={dark} toggleDark={toggleDark}/>
                <Outlet context={{dark, user}}/>
                <Footer dark={dark}/>
            </div>
        </NotificationsProvider>
    );
}

export default PageLayout;