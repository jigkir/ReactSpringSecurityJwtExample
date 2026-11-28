import {useState} from "react";
import {Navigate, useNavigate, useOutletContext} from "react-router-dom";
import {getAuthClasses} from "../../../styles/theme/AppStyles.jsx";
import Button from "../../../styles/ui/Button.jsx";
import {getCurrentUser, getCvCount, login} from "../../shared/core/api/Api.jsx";
import {devLoginAs} from "../../shared/core/api/DevApi.jsx";
import {
    EmailField,
    PasswordField,
    SubmitButton,
    translateWarning,
    validateField,
} from "../../../utils/forms/CommonFields.jsx";
import {useTranslation} from "react-i18next";
import {i18nError} from "../../../utils/i18n/i18nError.jsx";
import {useDevMode} from "../../shared/core/dev/DevMode.jsx";
import DevLoginPanel from "../../shared/core/dev/DevLoginPanel.jsx";
import {PATHS} from "../../../routes/AppRoutes.jsx";

const DEFAULT_WARNINGS = {email: "", password: ""};

const Login = ({user, setError}) => {
    const navigate = useNavigate();
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {devMode} = useDevMode();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);

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

    const validateUser = () => {
        const updatedWarnings = {
            email: validateField("email", email),
            password: password ? "" : {key: "login.passwordRequired"},
        };

        setWarnings(updatedWarnings);
        return !updatedWarnings.email && !updatedWarnings.password;
    };



    const finishLogin = async (data) => {
        localStorage.setItem("token", data.accessToken);

        let userData;
        try {
            userData = await getCurrentUser();
        } catch {
            throw i18nError("login.userFetchFailed");
        }

        if (userData.role === "STUDENT") {
            let hasCv = false;
            try {
                const count = await getCvCount();
                hasCv = count > 0;
            } catch {
            }
            if (hasCv) navigate(PATHS.HOME);
            else navigate(PATHS.STUDENT_PORTFOLIO, {state: {requireCv: true}});
        } else {
            navigate(PATHS.HOME);
        }
    };

    const fetchFunc = async () => {
        setSubmitting(true);
        try {
            await finishLogin(await login(email.toLowerCase(), password));
        } catch (err) {

            if (err.status === 401 || err.status === 403) {
                setServerError({key: "login.invalidCredentials"});
                return;
            }


            if (err.status === 404) {
                setError(i18nError("login.noServer"));
            } else if (err.i18n) {
                setError(err);
            } else {
                setError(i18nError("login.genericError"));
            }
            navigate(PATHS.ERROR);
        } finally {
            setSubmitting(false);
        }
    };



    const loginAsDevUser = async (devUser) => {
        if (!devUser) return;
        setServerError("");
        try {
            await finishLogin(await devLoginAs(devUser.email));
        } catch (err) {
            if (err.i18n) setError(err);
            else setError(i18nError("login.genericError"));
            navigate(PATHS.ERROR);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setServerError("");

        if (validateUser()) {
            fetchFunc();
        }
    };

    if (user?.isLoggedIn) return <Navigate to={PATHS.HOME} replace/>;

    const serverErrorText = translateWarning(t, serverError);

    return (
        <div className={pageClass}>
            <div className={cardClass}>
                <h1 className={titleClass}>{t("login.title")}</h1>


                {devMode && (
                    <DevLoginPanel
                        dark={dark}
                        fieldClass={fieldClass}
                        labelClass={labelClass}
                        errorClass={errorClass}
                        onSelect={loginAsDevUser}
                    />
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {serverErrorText && (
                        <div className={serverErrorClass} role="alert">{serverErrorText}</div>
                    )}

                    <EmailField
                        value={email}
                        onChange={(e) => {
                            setWarnings((prev) => ({...prev, email: ""}));
                            setServerError("");
                            setEmail(e.target.value.trim());
                        }}
                        warning={translateWarning(t, warnings.email)}
                        labelClass={labelClass}
                        fieldClass={fieldClass}
                        errorClass={errorClass}
                    />

                    <PasswordField
                        value={password}
                        onChange={(e) => {
                            setWarnings((prev) => ({...prev, password: ""}));
                            setServerError("");
                            setPassword(e.target.value);
                        }}
                        warning={translateWarning(t, warnings.password)}
                        labelClass={labelClass}
                        fieldClass={fieldClass}
                        eyeClass={eyeClass}
                        errorClass={errorClass}
                        show={showPassword}
                        onToggleShow={() => setShowPassword((p) => !p)}
                    />


                    <SubmitButton
                        disabled={!email || !password || submitting}
                        loading={submitting}
                        loadingLabel={t("login.submit")}
                        label={t("login.submit")}
                        icon="login"
                        submitClass={submitClass}
                    />
                </form>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <p className={`${subtextClass} mt-0!`}>{t("login.noAccount")}</p>
                    <Button type="button" tone="primary" lockTone dark={dark} size="sm" icon="person_add"
                            onClick={() => navigate(PATHS.SIGNUP)}>
                        {t("login.signupLink")}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Login;
