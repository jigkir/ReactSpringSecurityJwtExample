import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getDisciplines, signupEmployer} from '../../../api/Api.jsx';
import {
    ConfirmPasswordField,
    DisciplineField,
    EmailField,
    Field,
    FirstNameField,
    LastNameField,
    PasswordField,
    SubmitButton,
    translateWarning,
    validateField,
} from '../../../../utils/CommonFields.jsx';

const DEFAULT_FORM = {
    companyName: "",
    sectorActivity: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
};

const DEFAULT_WARNINGS = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, ""]));

const isAllFilled = (form) => Object.values(form).every(v => v !== "");

// All validators return "" or {key, options?} — translated at render time.
const validateCompanyName = (value) => {
    const tr = value.trim();
    if (!tr) return {key: "employer.requiredCompanyName"};
    if (tr.length < 2) return {key: "employer.atLeastXCharacters", options: {amount: 2}};
    if (tr.length > 100) return {key: "employer.atMostXCharacters", options: {amount: 100}};
    return "";
};

const validatePhoneNumber = (value) => {
    if (!value) return {key: "employer.requiredPhoneNumber"};
    if (value.length !== 10) return {key: "employer.phoneNumberXDigits", options: {amount: 10}};
    return "";
};

const validateSectorActivity = (value) => value ? "" : {key: "employer.selectSectorOfActivity"};

const validateEmployerField = (field, value, formValues = {}) => {
    switch (field) {
        case "companyName":
            return validateCompanyName(value);
        case "phoneNumber":
            return validatePhoneNumber(value);
        case "sectorActivity":
            return validateSectorActivity(value);
        default:
            return validateField(field, value, formValues);
    }
};

const Employer = ({fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass}) => {
    const navigate = useNavigate();

    const {t} = useTranslation();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [sectors, setSectors] = useState([]);
    const [sectorsLoading, setSectorsLoading] = useState(true);
    const [sectorsFetchError, setSectorsFetchError] = useState("");

    useEffect(() => {
        getDisciplines()
            .then(setSectors)
            .catch(() => setSectorsFetchError({key: "employer.couldNotLoadActivity"}))
            .finally(() => setSectorsLoading(false));
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
        setServerError("");
        if (warnings[name]) {
            setWarnings(prev => ({...prev, [name]: ""}));
        }
    };

    const validateAll = () => {
        const newWarnings = {};
        let valid = true;
        for (const key of Object.keys(DEFAULT_FORM)) {
            const msg = validateEmployerField(key, form[key], form);
            newWarnings[key] = msg;
            if (msg) valid = false;
        }
        setWarnings(newWarnings);
        return valid;
    };

    const handlePhoneChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        handleChange({target: {name: "phoneNumber", value: digits}});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        if (!validateAll()) return;
        setSubmitting(true);
        try {
            await signupEmployer({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                companyName: form.companyName.trim(),
                discipline: form.sectorActivity,
                phoneNumber: form.phoneNumber,
            });
            navigate("/login");
        } catch (err) {
            switch (err.status) {
                case 409: {
                    const {field: conflictField = ""} = err.body ?? {};
                    if (conflictField === "email") {
                        setWarnings(w => ({...w, email: {key: "employer.emailInUse"}}));
                    } else {
                        setServerError({key: "employer.emailAlreadyExists"});
                    }
                    break;
                }
                case 400:
                    setServerError({key: "employer.invalidData"});
                    break;
                case undefined: // the request itself failed (no HTTP status)
                    setServerError({key: "employer.unableToReachServerError"});
                    break;
                default:
                    setServerError({key: "employer.genericServerError", options: {errorCode: err.status}});
            }
        } finally {
            setSubmitting(false);
        }
    };

    const serverErrorText = translateWarning(t, serverError);

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {serverErrorText && (
                <div className={serverErrorClass}>{serverErrorText}</div>
            )}

            <Field
                id="companyName" label={t("employer.companyName")} warning={translateWarning(t, warnings.companyName)}
                labelClass={labelClass} errorClass={errorClass}
            >
                <input
                    id="companyName" name="companyName" type="text"
                    value={form.companyName} onChange={handleChange}
                    maxLength={100} required className={fieldClass}
                />
            </Field>

            <FirstNameField
                value={form.firstName} onChange={handleChange} warning={translateWarning(t, warnings.firstName)}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <LastNameField
                value={form.lastName} onChange={handleChange} warning={translateWarning(t, warnings.lastName)}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <DisciplineField
                value={form.sectorActivity} onChange={handleChange}
                warning={translateWarning(t, warnings.sectorActivity)}
                label={t("employer.sectorOfActivityLabel")} name="sectorActivity"
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                options={sectors} loading={sectorsLoading} fetchError={translateWarning(t, sectorsFetchError)}
            />

            <EmailField
                value={form.email} onChange={handleChange} warning={translateWarning(t, warnings.email)}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <Field
                id="phoneNumber" label={t("employer.phoneNumber")} warning={translateWarning(t, warnings.phoneNumber)}
                labelClass={labelClass} errorClass={errorClass}
            >
                <input
                    id="phoneNumber" name="phoneNumber" type="tel"
                    inputMode="numeric"
                    value={form.phoneNumber}
                    onChange={handlePhoneChange}
                    maxLength={10} required className={fieldClass}
                />
            </Field>

            <PasswordField
                value={form.password} onChange={handleChange} warning={translateWarning(t, warnings.password)}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass} eyeClass={eyeClass}
                show={showPassword} onToggleShow={() => setShowPassword(p => !p)}
                hint={t("employer.passwordRequirements")}
                passwordHintClass={passwordHintClass}
            />

            <ConfirmPasswordField
                value={form.confirmPassword} onChange={handleChange}
                warning={translateWarning(t, warnings.confirmPassword)}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass} eyeClass={eyeClass}
                show={showConfirm} onToggleShow={() => setShowConfirm(p => !p)}
            />

            <SubmitButton
                disabled={!isAllFilled(form) || submitting}
                loading={submitting}
                loadingLabel={t("employer.accountCreationButtonLoading")}
                label={t("employer.accountCreationButton")}
                submitClass={submitClass}
            />
        </form>
    );
};

export default Employer;