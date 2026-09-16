export const RoleField = ({
    value, onChange, labelClass, errorClass, fieldClass,
    label = 'Role', options = [], loading = false, fetchError = '',
}) => (
    <Field id="role" label={label} warning={fetchError} labelClass={labelClass} errorClass={errorClass}>
        <select
            id="role" name="role"
            value={value} onChange={onChange}
            className={fieldClass}
            disabled={loading}
        >
            <option value="">
                {loading ? 'Loading…' : fetchError ? 'Failed to load' : '-- Select a role --'}
            </option>
            {options.map(({value: v, label: l}) => (
                <option key={v} value={v}>{l}</option>
            ))}
        </select>
    </Field>
);

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).+$/;

export const handleSpaceKeyDown = (e) => {
    if (e.key === ' ') {
        e.preventDefault();
    }
};

export const validateDiscipline = (value) => value ? '' : 'Please select a discipline.';

export const validateId = (value) => {
    const t = value.trim();
    if (!t) return 'ID is required.';
    if (t.length !== 7) return 'ID must be exactly 7 digits.';
    return '';
};

export function validateField(field, value, formValues = {}) {
    switch (field) {
        case 'firstName':
        case 'lastName': {
            const t = value.trim();
            if (!t) return 'This field is required.';
            if (t.length < 2) return 'Must be at least 2 characters.';
            if (t.length > 50) return 'Must be at most 50 characters.';
            return '';
        }
        case 'email': {
            const t = value.trim();
            if (!t) return 'Email address is required.';
            if (!EMAIL_REGEX.test(t)) return 'Invalid email format.';
            return '';
        }
        case 'password': {
            if (!value) return 'Password is required.';
            if (value.length < 8) return 'Must be at least 8 characters.';
            if (value.length > 50) return 'Must be at most 50 characters.';
            if (!PASSWORD_REGEX.test(value)) {
                return 'Must contain at least one digit, one lowercase, one uppercase, and one special character (@#$%^&+=!).';
            }
            return '';
        }
        case 'confirmPassword':
            if (!value) return 'Please confirm your password.';
            if (value !== formValues.password) return 'Passwords do not match.';
            return '';
        case 'discipline':
            return validateDiscipline(value);
        case 'studentId':
        case 'teacherId':
            return validateId(value);
        default:
            return '';
    }
}

export const Field = ({id, label, warning, labelClass, errorClass, children}) => (
    <div>
        <label htmlFor={id} className={labelClass}>{label}</label>
        {children}
        {warning && <p className={errorClass}>{warning}</p>}
    </div>
);

export const EyeIcon = ({open}) => open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
         strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
    </svg>
) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
         strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
);

export const MatriculeField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass,
    role = 'Student',
    name = 'studentId',
}) => {
    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
        onChange({target: {name, value: digits}});
    };

    return (
        <Field id={name} label={`${role} ID`} warning={warning} labelClass={labelClass} errorClass={errorClass}>
            <input
                id={name} name={name} type="text"
                inputMode="numeric"
                value={value}
                onChange={handleChange}
                required className={fieldClass}
            />
        </Field>
    );
};

export const FirstNameField = ({value, onChange, warning, labelClass, errorClass, fieldClass, label = 'First Name'}) => (
    <Field id="firstName" label={label} warning={warning} labelClass={labelClass} errorClass={errorClass}>
        <input
            id="firstName" name="firstName" type="text"
            value={value} onChange={onChange} onKeyDown={handleSpaceKeyDown}
            maxLength={50} required className={fieldClass}
        />
    </Field>
);

export const LastNameField = ({value, onChange, warning, labelClass, errorClass, fieldClass, label = 'Last Name'}) => (
    <Field id="lastName" label={label} warning={warning} labelClass={labelClass} errorClass={errorClass}>
        <input
            id="lastName" name="lastName" type="text"
            value={value} onChange={onChange}
            maxLength={50} required className={fieldClass}
        />
    </Field>
);

export const EmailField = ({value, onChange, warning, labelClass, errorClass, fieldClass, label = 'Email'}) => (
    <Field id="email" label={label} warning={warning} labelClass={labelClass} errorClass={errorClass}>
        <input
            id="email" name="email" type="email"
            value={value} onChange={onChange} onKeyDown={handleSpaceKeyDown}
            required className={fieldClass}
        />
    </Field>
);

export const DisciplineField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass,
    label = 'Discipline', options = [], loading = false, fetchError = '', name = "discipline"
}) => (
    <Field id="discipline" label={label} warning={warning} labelClass={labelClass} errorClass={errorClass} name={name}>
        <select
            id="discipline" name={name}
            value={value} onChange={onChange}
            required className={fieldClass}
            disabled={loading}
        >
            <option value="">
                {loading ? 'Loading…' : fetchError ? 'Failed to load' : '-- Select a ' +label.toLowerCase()+' --'}
            </option>
            {options.map(({value: v, label: l}) => (
                <option key={v} value={v}>{l}</option>
            ))}
        </select>
        {fetchError && <p className={errorClass}>{fetchError}</p>}
    </Field>
);

export const PasswordField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass, eyeClass,
    show, onToggleShow, hint, passwordHintClass, label = 'Password',
}) => (
    <Field id="password" label={label} warning={warning} labelClass={labelClass} errorClass={errorClass}>
        <div className="flex gap-2">
            <input
                id="password" name="password"
                type={show ? 'text' : 'password'}
                value={value} onChange={onChange} onKeyDown={handleSpaceKeyDown}
                maxLength={50} required className={fieldClass}
            />
            <button type="button" onClick={onToggleShow}
                    aria-label={show ? 'Hide password' : 'Show password'} className={eyeClass}>
                <EyeIcon open={show}/>
            </button>
        </div>
        {hint && <p className={passwordHintClass}>{hint}</p>}
    </Field>
);

export const ConfirmPasswordField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass, eyeClass,
    show, onToggleShow, label = 'Confirm Password',
}) => (
    <Field id="confirmPassword" label={label} warning={warning} labelClass={labelClass} errorClass={errorClass}>
        <div className="flex gap-2">
            <input
                id="confirmPassword" name="confirmPassword"
                type={show ? 'text' : 'password'}
                value={value} onChange={onChange} onKeyDown={handleSpaceKeyDown}
                required className={fieldClass}
            />
            <button type="button" onClick={onToggleShow}
                    aria-label={show ? 'Hide confirmation' : 'Show confirmation'} className={eyeClass}>
                <EyeIcon open={show}/>
            </button>
        </div>
    </Field>
);

export const SubmitButton = ({disabled, loading, loadingLabel, label, submitClass}) => (
    <button
        type="submit"
        disabled={disabled}
        className={submitClass}
    >
        {loading ? loadingLabel : label}
    </button>
);