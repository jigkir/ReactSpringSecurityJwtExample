import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {PATHS} from "../../../routes/AppRoutes.jsx";

const Logout = ({setUser}) => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem("token");
        setUser({});
        navigate(PATHS.ROOT);
    }, []);

    return null;
};

export default Logout;