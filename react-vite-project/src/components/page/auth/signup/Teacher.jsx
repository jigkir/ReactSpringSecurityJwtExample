import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import fetcher from '../../../../utils/fetcher.js';
import {useTranslation} from 'react-i18next';
import {
    ConfirmPasswordField,
    DisciplineField,
    EmailField,
    FirstNameField,
    LastNameField,
    MatriculeField,
    PasswordField,
    SubmitButton,
    translateWarning,
    validateField,
} from '../../../../utils/CommonFields.jsx';

const ID_FIELD = "teacherId";

const DEFAULT_FORM = {
    firstName: "",
    lastName: "",
    [ID_FIELD]: "",
    discipline: "",
    email: "",
    password: "",
    confirmPassword: "",
};

const DEFAULT_WARNINGS = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, ""]));
const isAllFilled = (form) => Object.values(form).every(v => v !== "");

const Teacher = ({fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass}) => {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [disciplines, setDisciplines] = useState([]);
    const [disciplinesLoading, setDisciplinesLoading] = useState(true);
    const [disciplinesFetchError, setDisciplinesFetchError] = useState("");

    useEffect(() => {
        fetcher("disciplines", {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.disciplines ?? []);
                setDisciplines(list.map(d => ({
                    value: typeof d === "string" ? d : d.value,
                    label: typeof d === "string" ? d : (d.label ?? d.value),
                })));
            })
            .catch(() => setDisciplinesFetchError({key: "commonFields.fetchError"}))
            .finally(() => setDisciplinesLoading(false));
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
        setServerError("");
        if (warnings[name]) setWarnings(prev => ({...prev, [name]: ""}));
    };

    const validateAll = () => {
        const newWarnings = {};
        let valid = true;
        for (const key of Object.keys(DEFAULT_FORM)) {
            const msg = validateField(key, form[key], form);
            newWarnings[key] = msg;
            if (msg) valid = false;
        }
        setWarnings(newWarnings);
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        if (!validateAll()) return;

        setSubmitting(true);
        try {
            const response = await fetcher("teacher/signup", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    [ID_FIELD]: form[ID_FIELD],
                    discipline: form.discipline,
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                }),
            });

            if (response.ok) {
                navigate("/login");
                return;
            }

            switch (response.status) {
                case 409: {
                    let body = {};
                    try {
                        body = await response.json();
                    } catch {
                    }
                    const {field: conflictField = ""} = body ?? {};
                    if (conflictField === ID_FIELD) {
                        setWarnings(w => ({...w, [ID_FIELD]: {key: "teacher.existingId"}}));
                    } else if (conflictField === "email") {
                        setWarnings(w => ({...w, email: {key: "teacher.emailInUse"}}));
                    } else {
                        setServerError({key: "teacher.eitherIdOrEmailInUse"});
                    }
                    break;
                }
                case 400:
                    setServerError({key: "teacher.invalidData"});
                    break;
                default:
                    setServerError({key: "teacher.genericServerError", options: {errorCode: response.status}});
            }
        } catch {
            setServerError({key: "teacher.unableToReachServerError"});
        } finally {
            setSubmitting(false);
        }
    };

    const sharedProps = {labelClass, errorClass, fieldClass, onChange: handleChange};
    const serverErrorText = translateWarning(t, serverError);

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {serverErrorText && <div className={serverErrorClass}>{serverErrorText}</div>}

            <FirstNameField  {...sharedProps} value={form.firstName} warning={translateWarning(t, warnings.firstName)}/>
            <LastNameField   {...sharedProps} value={form.lastName} warning={translateWarning(t, warnings.lastName)}/>
            <MatriculeField  {...sharedProps} value={form[ID_FIELD]} warning={translateWarning(t, warnings[ID_FIELD])}
                             name={ID_FIELD} limit={5}/>
            <DisciplineField {...sharedProps} value={form.discipline} warning={translateWarning(t, warnings.discipline)}
                             options={disciplines} loading={disciplinesLoading}
                             fetchError={translateWarning(t, disciplinesFetchError)}/>
            <EmailField      {...sharedProps} value={form.email} warning={translateWarning(t, warnings.email)}/>
            <PasswordField   {...sharedProps} value={form.password} warning={translateWarning(t, warnings.password)}
                             eyeClass={eyeClass} show={showPassword} onToggleShow={() => setShowPassword(p => !p)}
                             hint={t("teacher.passwordRequirements")} passwordHintClass={passwordHintClass}/>
            <ConfirmPasswordField {...sharedProps} value={form.confirmPassword}
                                  warning={translateWarning(t, warnings.confirmPassword)}
                                  eyeClass={eyeClass} show={showConfirm} onToggleShow={() => setShowConfirm(p => !p)}/>

            <SubmitButton
                disabled={!isAllFilled(form) || submitting}
                loading={submitting}
                loadingLabel={t("teacher.accountCreationButtonLoading")}
                label={t("teacher.accountCreationButton")}
                submitClass={submitClass}
            />
        </form>
    );
};

export default Teacher;