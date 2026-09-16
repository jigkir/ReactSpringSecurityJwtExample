import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import fetcher from "../../../../utils/fetcher.js";
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

const DEFAULT_FORM = {
    firstName: '',
    lastName: '',
    studentId: '',
    discipline: '',
    email: '',
    password: '',
    confirmPassword: '',
};

const DEFAULT_WARNINGS = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, '']));

function isAllFilled(form) {
    return Object.values(form).every(v => v !== '');
}

const Student = ({fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass}) => {
    const navigate = useNavigate();

    const [form, setForm] = useState(DEFAULT_FORM);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [disciplines, setDisciplines] = useState([]);
    const [disciplinesLoading, setDisciplinesLoading] = useState(true);
    const [disciplinesFetchError, setDisciplinesFetchError] = useState('');

    useEffect(() => {
        fetcher('disciplines', {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.disciplines ?? []);
                setDisciplines(list.map(d => ({
                    value: typeof d === 'string' ? d : d.value,
                    label: typeof d === 'string' ? d : (d.label ?? d.value),
                })));
            })
            .catch(() => setDisciplinesFetchError('Could not load disciplines.'))
            .finally(() => setDisciplinesLoading(false));
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm(prev => ({...prev, [name]: value}));
        setServerError('');
        if (warnings[name]) {
            setWarnings(prev => ({...prev, [name]: ''}));
        }
    };

    const validateAll = () => {
        const newWarnings = {};
        let valid = true;
        Object.keys(DEFAULT_FORM).forEach(key => {
            const msg = validateField(key, form[key], form);
            newWarnings[key] = msg;
            if (msg) valid = false;
        });
        setWarnings(newWarnings);
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        if (!validateAll()) return;

        setSubmitting(true);
        try {
            const response = await fetcher('student/signup', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8',
                },
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    studentId: form.studentId,
                    discipline: form.discipline,
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                }),
            });

            if (response.ok) {
                navigate('/login');
                return;
            }

            switch (response.status) {
                case 409: {
                    let body = {};
                    try { body = await response.json(); } catch {}
                    const { field: conflictField = '' } = body ?? {};
                    if (conflictField === 'studentId') {
                        setWarnings(w => ({...w, studentId: 'This student ID is already in use.'}));
                    } else if (conflictField === 'email') {
                        setWarnings(w => ({...w, email: 'This email address is already in use.'}));
                    } else {
                        setServerError('An account with this student ID or email already exists.');
                    }
                    break;
                }
                case 400:
                    setServerError('The submitted data is invalid. Please review the fields.');
                    break;
                default:
                    setServerError(`Server error (${response.status}). Please try again.`);
            }
        } catch {
            setServerError('Unable to reach the server. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {serverError && (
                <div className={serverErrorClass}>{serverError}</div>
            )}

            <FirstNameField
                value={form.firstName} onChange={handleChange} warning={warnings.firstName}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <LastNameField
                value={form.lastName} onChange={handleChange} warning={warnings.lastName}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <MatriculeField
                value={form.studentId} onChange={handleChange} warning={warnings.studentId}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                name="studentId"
                role="Student"
            />

            <DisciplineField
                value={form.discipline} onChange={handleChange} warning={warnings.discipline}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                options={disciplines} loading={disciplinesLoading} fetchError={disciplinesFetchError}
            />

            <EmailField
                value={form.email} onChange={handleChange} warning={warnings.email}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <PasswordField
                value={form.password} onChange={handleChange} warning={warnings.password}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass} eyeClass={eyeClass}
                show={showPassword} onToggleShow={() => setShowPassword(p => !p)}
                hint="8–50 characters · digit · lowercase · uppercase · special character"
                passwordHintClass={passwordHintClass}
            />

            <ConfirmPasswordField
                value={form.confirmPassword} onChange={handleChange} warning={warnings.confirmPassword}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass} eyeClass={eyeClass}
                show={showConfirm} onToggleShow={() => setShowConfirm(p => !p)}
            />

            <SubmitButton
                disabled={!isAllFilled(form) || submitting}
                loading={submitting}
                loadingLabel="Creating account…"
                label="Create account"
                submitClass={submitClass}
            />

        </form>
    );
};

export default Student;