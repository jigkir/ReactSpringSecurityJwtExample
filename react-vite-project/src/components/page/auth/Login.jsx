import {useState} from 'react';
import {Navigate, useNavigate, useOutletContext} from 'react-router-dom';
import {getAuthClasses} from '../../../styles/appStyles.jsx';
import {getCurrentUser, getCvCount, login} from '../../api/Api.jsx';
import {EmailField, PasswordField, translateWarning} from '../../../utils/CommonFields.jsx';
import {useTranslation} from 'react-i18next';
import {i18nError} from "../../../utils/i18nError.jsx";

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
            updatedWarnings.email = {key: "login.emailRequired"};
            isValid = false;
        } else if (!validateEmail()) {
            updatedWarnings.email = {key: "login.emailInvalid"};
            isValid = false;
        } else {
            updatedWarnings.email = "";
        }

        if (!password) {
            updatedWarnings.password = {key: "login.passwordRequired"};
            isValid = false;
        } else {
            updatedWarnings.password = "";
        }

        setWarnings(updatedWarnings);
        return isValid;
    };

    // region Api.jsx communication
    const fetchFunc = async () => {
        try {
            const data = await login(email.toLowerCase(), password);
            localStorage.setItem("token", data.accessToken);

            let userData;
            try {
                userData = await getCurrentUser();
            } catch {
                throw i18nError("login.userFetchFailed");
            }

            if (userData.role === "STUDENT") {
                const studentId = userData.studentId || userData.matricule || userData.id;
                let hasCv = false;
                try {
                    const count = await getCvCount(studentId);
                    hasCv = count > 0;
                } catch { /* fallback: send to /cv */ }
                navigate(hasCv ? "/home" : "/cv");
            } else {
                navigate("/home");
            }
        } catch (err) {
            if (err.i18n) {
                setError(err);
                navigate("/error");
                return;
            }
            switch (err.status) {
                case 401:
                    setServerError({key: "login.invalidCredentials"});
                    return;
                case 404:
                    setError(i18nError("login.noServer"));
                    navigate("/error");
                    return;
                default:
                    setError(i18nError("login.genericError"));
                    navigate("/error");
                    return;
            }
        }
    };
    // endregion

    const handleSubmit = (e) => {
        e.preventDefault();
        setServerError("");

        if (validateUser()) {
            fetchFunc();
        }
    };

    if (user?.isLoggedIn) return <Navigate to="/home" replace/>;

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
                            warning={translateWarning(t, warnings.email)}
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
                            warning={translateWarning(t, warnings.password)}
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
                            {translateWarning(t, serverError)}
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