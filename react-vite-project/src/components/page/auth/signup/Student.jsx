import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import fetcher from "../../../../utils/fetcher.js";
import {useTranslation} from 'react-i18next';
import {
    FirstNameField,
    LastNameField,
    MatriculeField,
    DisciplineField,
    EmailField,
    PasswordField,
    ConfirmPasswordField,
    SubmitButton,
    validateField,
} from "../../../../utils/CommonFields.jsx";

// The student-specific ID field name — single source of truth for all references below
const ID_FIELD = "studentId";

const DEFAULT_FORM = {
    firstName: "",
    lastName: "",
    [ID_FIELD]: "",
    discipline: "",
    email: "",
    password: "",
    confirmPassword: "",
};



// Mirror DEFAULT_FORM shape with empty strings — one warning slot per field
const DEFAULT_WARNINGS = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, ""]));

// Submit button stays disabled until every field has a value
const isAllFilled = (form) => Object.values(form).every(v => v !== "");

const Student = ({ fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState("");   // API-level error message
    const [submitting, setSubmitting] = useState(false);  // prevents double-submit

    const [disciplines, setDisciplines] = useState([]);
    const [disciplinesLoading, setDisciplinesLoading] = useState(true);
    const [disciplinesFetchError, setDisciplinesFetchError] = useState("");

    // Fetch discipline options once on mount
    useEffect(() => {
        fetcher("disciplines", {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                // Backend may return a plain array or { disciplines: [...] }
                const list = Array.isArray(data) ? data : (data.disciplines ?? []);
                setDisciplines(list.map(d => ({
                    value: typeof d === "string" ? d : d.value,
                    label: typeof d === "string" ? d : (d.label ?? d.value),
                })));
            })
            .catch(() => setDisciplinesFetchError("Could not load disciplines."))
            .finally(() => setDisciplinesLoading(false));
    }, []);

    // Clear the field's inline warning as soon as the user starts correcting it
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setServerError("");
        if (warnings[name]) setWarnings(prev => ({ ...prev, [name]: "" }));
    };

    // Run every field through validateField and collect error messages
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
        if (!validateAll()) return; // stop early if any field is invalid

        setSubmitting(true);
        try {
            const response = await fetcher("student/signup", {
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

            if (response.ok) { navigate("/login"); return; }

            // Map known server error codes to field-level or page-level messages
            switch (response.status) {
                case 409: {
                    let body = {};
                    try { body = await response.json(); } catch {}
                    const { field: conflictField = "" } = body ?? {};
                    if (conflictField === ID_FIELD) {
                        setWarnings(w => ({ ...w, [ID_FIELD]: t("student.existingId") }));
                    } else if (conflictField === "email") {
                        setWarnings(w => ({ ...w, email: t("student.emailInUse") }));
                    } else {
                        setServerError(t("student.eitherEmailOrIdInUse"));
                    }
                    break;
                }
                case 400:
                    setServerError(t("student.invalidData"));
                    break;
                default:
                    setServerError(t("student.genericServerErrorPt1")+response.status+("student.genericServerErrorPt2"));
            }
        } catch {
            setServerError(t("student.unableToReachServerError"));
        } finally {
            setSubmitting(false);
        }
    };

    // Props shared by every field component — spread with {...sharedProps} to avoid repetition
    const sharedProps = { labelClass, errorClass, fieldClass, onChange: handleChange };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {serverError && <div className={serverErrorClass}>{serverError}</div>}

            <FirstNameField  {...sharedProps} value={form.firstName} warning={warnings.firstName}/>
            <LastNameField   {...sharedProps} value={form.lastName} warning={warnings.lastName}/>
            <MatriculeField  {...sharedProps} value={form[ID_FIELD]} warning={warnings[ID_FIELD]} name={ID_FIELD}
                             role="Student"/>
            <DisciplineField {...sharedProps} value={form.discipline} warning={warnings.discipline}
                             options={disciplines} loading={disciplinesLoading} fetchError={disciplinesFetchError}/>
            <EmailField      {...sharedProps} value={form.email} warning={warnings.email}/>
            <PasswordField   {...sharedProps} value={form.password} warning={warnings.password}
                             eyeClass={eyeClass} show={showPassword} onToggleShow={() => setShowPassword(p => !p)}
                             hint="8–50 characters · digit · lowercase · uppercase · special character"
                             passwordHintClass={passwordHintClass}/>
            <ConfirmPasswordField {...sharedProps} value={form.confirmPassword} warning={warnings.confirmPassword}
                                  eyeClass={eyeClass} show={showConfirm} onToggleShow={() => setShowConfirm(p => !p)}/>

            <SubmitButton
                disabled={!isAllFilled(form) || submitting}
                loading={submitting}
                loadingLabel={t("student.accountCreationButton")}
                label={t("student.accountCreationButtonLoading")}
                submitClass={submitClass}
            />
        </form>
    );
};

export default Student;