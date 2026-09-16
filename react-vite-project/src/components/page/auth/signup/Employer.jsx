import React, { useState, useEffect } from "react";
import {useNavigate} from "react-router-dom";
import fetcher from "../../../../utils/fetcher.js";
import {
    FirstNameField,
    LastNameField,
    DisciplineField,
    EmailField,
    PasswordField,
    ConfirmPasswordField,
    SubmitButton,
    validateField,
    Field,
} from "../../../../utils/CommonFields.jsx";

const DEFAULT_FORM = {
    companyName:"",
    sectorActivity:"",
    firstName:"",
    lastName:"",
    email:"",
    phoneNumber:"",
    password: '',
    confirmPassword: '',
}

const DEFAULT_WARNINGS = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, '']));

function isAllFilled(form) {
    return Object.values(form).every(v => v !== '');
}

const Employer = ({fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass}) => {

    const navigate = useNavigate();

    const [form, setForm] = useState(DEFAULT_FORM);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [sectorActivitys, setsectorActivitys] = useState([]);
    const [sectorActivitysLoading, setsectorActivitysLoading] = useState(true);
    const [sectorActivitysFetchError, setsectorActivitysFetchError] = useState('');

    useEffect(() => {
        fetcher('disciplines', {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.disciplines ?? []);
                setsectorActivitys(list.map(d => ({
                    value: typeof d === 'string' ? d : d.value,
                    label: typeof d === 'string' ? d : (d.label ?? d.value),
                })));
            })
            .catch(() => setsectorActivitysFetchError('Could not load sector of Activitys.'))
            .finally(() => setsectorActivitysLoading(false));
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
            const response = await fetcher('employer/register', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8',
                },
                body: JSON.stringify({
                    lastName: form.lastName.trim(),
                    firstName: form.firstName.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                    companyName: form.companyName.trim(),
                    activitySector: form.sectorActivity,
                    phoneNumber: form.phoneNumber
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

            <Field
                id="companyName" label="Company Name" warning={warnings.companyName} labelClass={labelClass} errorClass={errorClass}>
                <input
                    id="companyName" name="companyName" type="text"
                    value={form.companyName} onChange={handleChange}
                    required className={fieldClass}
                />
            </Field>

            <FirstNameField
                value={form.firstName} onChange={handleChange} warning={warnings.firstName}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <LastNameField
                value={form.lastName} onChange={handleChange} warning={warnings.lastName}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <DisciplineField
                value={form.sectorActivity} onChange={handleChange} warning={warnings.sectorActivity} label="Sector of Activity" name="sectorActivity"
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                options={sectorActivitys} loading={sectorActivitysLoading} fetchError={sectorActivitysFetchError}
            />

            <EmailField
                value={form.email} onChange={handleChange} warning={warnings.email}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
            />

            <Field
                id="phoneNumber" label="Phone Number" warning={warnings.phoneNumber} labelClass={labelClass} errorClass={errorClass}>
                <input
                    id="phoneNumber" name="phoneNumber" type="tel"
                    inputMode="numeric"
                    value={form.phoneNumber}
                    onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange({target: {name: 'phoneNumber', value: digits}});
                    }}
                    maxLength={10} required className={fieldClass}
                />
            </Field>

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
}

export default Employer;