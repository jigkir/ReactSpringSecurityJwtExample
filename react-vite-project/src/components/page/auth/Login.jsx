import {useState} from "react";
import {useNavigate, useOutletContext} from "react-router-dom";
import {getAuthClasses} from './styles/authStyles.jsx';
import fetcher from "../../../utils/fetcher.js";
import {
    EmailField,
    PasswordField,
} from "../../../utils/CommonFields.jsx";

const Login = ({user, setError}) => {
    const navigate = useNavigate();
    const {dark} = useOutletContext();
    // const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [warnings, setWarnings] = useState({
        email: '',
        password: ''
    });

    const classes = getAuthClasses(dark);
    const {
        fieldClass,
        labelClass,
        cardClass,
        pageClass,
        titleClass,
        subtextClass,
        errorClass,
        eyeClass,
        submitClass
    } = classes;

    const validateEmail = () => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(email);
    };

    const validateUser = () => {
        let isValid = true;
        const updatedWarnings = {...warnings};

        if (!email) {
            updatedWarnings.email = 'Le courriel est obligatoire.';
            isValid = false;
        } else if (!validateEmail()) {
            updatedWarnings.email = 'Le courriel est invalide.';
            isValid = false;
        } else {
            updatedWarnings.email = '';
        }

        if (!password) {
            updatedWarnings.password = 'Le mot de passe est obligatoire.';
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
                        setServerError('Email or password not valid');
                        return;
                    case 404:
                        throw new Error('No server available');
                    default:
                        throw new Error('Not ok');
                }
            }
            const data = await response.json();
            localStorage.setItem('token', data.accessToken);

            const userResponse = await fetcher('users/current', {});
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user info');
            }
            const userData = await userResponse.json();

            const userRole = userData.role;
            if (userRole === 'EMPRUNTEUR') {
                navigate('/emprunteur');
            } else if (userRole === 'PREPOSE') {
                navigate('/prepose');
            } else if (userRole === 'GESTIONNAIRE') {
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
        setServerError('');

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
        <div className={pageClass}>
            <div className={cardClass}>
                <h2 className={titleClass}>Sign In</h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                        <EmailField
                            value={email}
                            onChange={(e) => {
                                setWarnings({...warnings, email: ''});
                                setEmail(e.target.value.trim());
                            }}
                            labelClass={labelClass} fieldClass={fieldClass}
                            required
                        />
                        {warnings.email && (
                            <p className={errorClass}>
                                {warnings.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <PasswordField
                            value={password}
                            onChange={(e) => {
                                setWarnings({...warnings, password: ''});
                                setPassword(e.target.value);
                            }}
                            labelClass={labelClass}
                            fieldClass={fieldClass}
                            eyeClass={eyeClass}
                            show={showPassword}
                            onToggleShow={() => setShowPassword(!showPassword)}
                            required
                        />
                        {warnings.password && (
                            <p className={errorClass}>
                                {warnings.password}
                            </p>
                            )}
                    </div>

                    {serverError && (
                        <div className={errorClass}>
                            {serverError}
                        </div>
                    )}

                    <button type="submit" className={submitClass}>
                        Sign in
                    </button>
                </form>
                <p className={subtextClass}>
                    No account yet?{' '}
                    <button onClick={() => navigate('/signup')} className="text-blue-500 hover:underline font-medium">
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;