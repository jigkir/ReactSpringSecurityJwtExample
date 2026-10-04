import {Outlet} from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

function PageLayout({user, dark, toggleDark}) {
    return (
        <div className="flex flex-col flex-1">
            <Navbar user={user} dark={dark} toggleDark={toggleDark}/>
            <Outlet context={{dark, user}}/>
            <Footer dark={dark}/>
        </div>
    );
}

export default PageLayout;