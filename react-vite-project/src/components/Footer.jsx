import React from "react";
import {Link} from "react-router-dom";

function Footer() {
    return (
        <footer className="text-center flex flex-col mt-auto">
            <p>Copyright &copy; 2021</p>
            <Link to='/about'>About</Link>
        </footer>
    );
}

export default Footer;