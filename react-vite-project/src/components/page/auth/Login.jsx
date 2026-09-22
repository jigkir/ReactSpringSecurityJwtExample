import {useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router-dom';
import {getAuthClasses} from '../../../styles/appStyles.jsx';
import fetcher from '../../../utils/fetcher.js';
import {
    EmailField,
    PasswordField,
} from '../../../utils/CommonFields.jsx';
import {useTranslation} from 'react-i18next';

const Login = ({user, setError}) => {
    const navigate = useNavigate();
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState("");
    const [warnings, setWarnings] = useState({
        email: "",
        password: ""
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
        submitClass,
        serverErrorClass,
    } = classes;

    const validateEmail = () => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(email);
    };

    const validateUser = () => {
        let isValid = true;
        const updatedWarnings = {...warnings};

        if (!email) {
            updatedWarnings.email = t("login.emailRequired");
            isValid = false;
        } else if (!validateEmail()) {
            updatedWarnings.email = t("login.emailInvalid");
            isValid = false;
        } else {
            updatedWarnings.email = "";
        }

        if (!password) {
            updatedWarnings.password = t("login.passwordRequired");
            isValid = false;
        } else {
            updatedWarnings.password = "";
        }

        setWarnings(updatedWarnings);
        return isValid;
    };

    const fetchFunc = async () => {
        try {
            const response = await fetcher("login", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    password
                }),
            });
            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        setServerError(t("login.invalidCredentials"));
                        return;
                    case 404:
                        throw new Error(t("login.noServer"));
                    default:
                        throw new Error(t("login.genericError"));
                }
            }
            const data = await response.json();
            localStorage.setItem("token", data.accessToken);

            const userResponse = await fetcher("users/current", {});
            if (!userResponse.ok) {
                throw new Error(t("login.userFetchFailed"));
            }

            const userData = await userResponse.json();

            if (userData.role === "STUDENT") {
                navigate("/cv");
            } else {
                navigate("/home");
            }

        } catch (error) {
            setError(error);
            navigate("/error");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setServerError("");

        if (validateUser()) {
            fetchFunc();
        }
    };

    if (user?.isLoggedIn) {
        navigate("/home");
    }

    return (
        <div className={pageClass}>
            <div className={cardClass}>
                <h2 className={titleClass}>{t("login.title")}</h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                        <EmailField
                            value={email}
                            onChange={(e) => {
                                setWarnings({...warnings, email: ""});
                                setEmail(e.target.value.trim());
                            }}
                            warning={warnings.email}
                            labelClass={labelClass}
                            fieldClass={fieldClass}
                            errorClass={errorClass}
                        />
                    </div>

                    <div>
                        <PasswordField
                            value={password}
                            onChange={(e) => {
                                setWarnings({...warnings, password: ""});
                                setPassword(e.target.value);
                            }}
                            warning={warnings.password}
                            labelClass={labelClass}
                            fieldClass={fieldClass}
                            eyeClass={eyeClass}
                            errorClass={errorClass}
                            show={showPassword}
                            onToggleShow={() => setShowPassword(!showPassword)}
                        />
                    </div>

                    {serverError && (
                        <div className={serverErrorClass} role="alert">
                            {serverError}
                        </div>
                    )}

                    <button type="submit" className={submitClass}>
                        {t("login.submit")}
                    </button>
                </form>
                <p className={subtextClass}>
                    {t("login.noAccount")}{" "}
                    <button onClick={() => navigate("/signup")} className="text-blue-500 hover:underline font-medium">
                        {t("login.signupLink")}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;