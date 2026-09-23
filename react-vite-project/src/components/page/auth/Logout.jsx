import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

const Logout = ({setUser}) => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.clear();
        setUser({});
        navigate("/");
    }, []);

    return null;
};

export default Logout;