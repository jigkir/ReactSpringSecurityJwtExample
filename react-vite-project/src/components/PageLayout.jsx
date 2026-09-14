import {Outlet} from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

function PageLayout({user, dark, toggleDark}) {
    return (
        <div id="pagelayout" className="pageLayout flex flex-col flex-1">
            <Navbar user={user} dark={dark} toggleDark={toggleDark}/>
            <Outlet context={{dark}}/>
            <Footer/>
        </div>
    );
}

export default PageLayout;