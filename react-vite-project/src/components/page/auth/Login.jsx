import {useState} from "react";
import {useNavigate, useOutletContext} from "react-router-dom";
import fetcher from "../../../utils/fetcher.js";
import {useTranslation} from 'react-i18next';

const Login = ({user, setError}) => {
    const navigate = useNavigate();
    const {dark} = useOutletContext();
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { t } = useTranslation();
    const [warnings, setWarnings] = useState({
        email: '',
        password: ''
    });

    const validateEmail = () => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(email);
    };

    const validatePassword = () => true;

    const validateUser = () => {
        let isValid = true;
        const updatedWarnings = {...warnings};

        if (!validateEmail()) {
            updatedWarnings.email = 'courriel invalide';
            isValid = false;
        } else {
            updatedWarnings.email = '';
        }

        if (!validatePassword()) {
            updatedWarnings.password = 'mot de passe invalide';
            isValid = false;
        } else {
            updatedWarnings.password = '';
        }

        setWarnings(updatedWarnings);
        return isValid;
    };

    const fetchFunc = async () => {
        try {
            const response = await fetcher('login', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8',
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    password
                }),
            });
            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        throw new Error(t("login.error401"));
                    case 404:
                        throw new Error(t("login.error404"));
                    default:
                        throw new Error(t("login.errorGeneric"));
                }
            }
            const data = await response.json();
            localStorage.setItem('token', data.accessToken);

            const userResponse = await fetcher('me', {});
            if (!userResponse.ok) {
                throw new Error(t("login.errorUserFetchFail"));
            }
            const userData = await userResponse.json();

            const userRole = userData.role;
            if (userRole === 'ROLE_EMPRUNTEUR') {
                navigate('/emprunteur');
            } else if (userRole === 'ROLE_PREPOSE') {
                navigate('/prepose');
            } else if (userRole === 'ROLE_GESTIONNAIRE') {
                navigate('/gestionnaire');
            } else {
                navigate('/');
            }
        } catch (error) {
            setError(error);
            navigate('/error');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateUser()) {
            fetchFunc();
        }
    };

    if (user?.isLoggedIn) {
        if (user.role === 'ROLE_EMPRUNTEUR') navigate('/emprunteur');
        else if (user.role === 'ROLE_PREPOSE') navigate('/prepose');
        else if (user.role === 'ROLE_GESTIONNAIRE') navigate('/gestionnaire');
        else navigate('/');
    }

    return (
        <div>
            <div>
                <h2>Sign In</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="role">{t("login.role")}</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="">-- Select a role --</option>
                            <option value="student">{t("login.student")}</option>
                            <option value="teacher">{t("login.teacher")}</option>
                            <option value="manager">{t("login.manager")}</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="email">{t("login.email")}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setWarnings({...warnings, email: ''});
                                setEmail(e.target.value.trim());
                            }}
                            required
                        />
                        {warnings.email && <div>{warnings.email}</div>}
                    </div>

                    <div>
                        <label htmlFor="password">{t("login.password")}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setWarnings({...warnings, password: ''});
                                setPassword(e.target.value.trim());
                            }}
                            required
                        />
                        {warnings.password && <div>{warnings.password}</div>}
                    </div>

                    <button type="submit" disabled={!email || !password}>
                        {t("login.submit")}
                    </button>
                </form>
                <p>
                    {t("login.noAccount")}{' '}
                    <button onClick={() => navigate('/signup')}>
                        {t("signUpButton")}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;