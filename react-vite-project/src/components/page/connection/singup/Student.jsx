import { useState } from 'react';

const DISCIPLINES = [
    'INFORMATIQUE',
    'GENIE_LOGICIEL',
    'RESEAUX',
    'ADMINISTRATION',
    'COMPTABILITE',
    'MARKETING',
];

const DEFAULT_FORM = {
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    discipline: '',
};

const DEFAULT_WARNINGS = {
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    password: '',
    discipline: '',
};

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).+$/;
const DIGITS_ONLY_REGEX = /^[0-9]*$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

const Student = () => {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [warnings, setWarnings] = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);

    const validate = (fieldName, value) => {
        switch (fieldName) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) return 'This field is required.';
                if (value.trim().length < 2) return 'Must be at least 2 characters.';
                if (value.trim().length > 50) return 'Must be at most 50 characters.';
                return '';
            case 'studentId':
                if (!value.trim()) return 'Student ID is required.';
                if (!DIGITS_ONLY_REGEX.test(value.trim())) return 'Student ID must contain digits only.';
                return '';
            case 'email':
                if (!value.trim()) return 'Email is required.';
                if (!EMAIL_REGEX.test(value.trim())) return 'Invalid email address.';
                return '';
            case 'password':
                if (!value) return 'Password is required.';
                if (value.length < 8) return 'Must be at least 8 characters.';
                if (value.length > 50) return 'Must be at most 50 characters.';
                if (!PASSWORD_REGEX.test(value))
                    return 'Must contain at least one digit, one lowercase, one uppercase, and one special character (@#$%^&+=).';
                return '';
            case 'discipline':
                if (!value) return 'Please select a discipline.';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setWarnings(prev => ({ ...prev, [name]: validate(name, value) }));
    };

    const validateAll = () => {
        const newWarnings = {};
        let isValid = true;
        Object.keys(DEFAULT_FORM).forEach(field => {
            const msg = validate(field, form[field]);
            newWarnings[field] = msg;
            if (msg) isValid = false;
        });
        setWarnings(newWarnings);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateAll()) return;

        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            studentId: form.studentId.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            discipline: form.discipline,
        };

        console.log('Register student:', payload);
        // TODO: call your API here
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* First Name */}
            <div>
                <label htmlFor="firstName" className={labelClass}>First Name</label>
                <input
                    id="firstName" name="firstName" type="text"
                    value={form.firstName} onChange={handleChange}
                    minLength={2} maxLength={50} required
                    className={fieldClass}
                />
                {warnings.firstName && <p className="mt-1 text-sm text-red-600">{warnings.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
                <label htmlFor="lastName" className={labelClass}>Last Name</label>
                <input
                    id="lastName" name="lastName" type="text"
                    value={form.lastName} onChange={handleChange}
                    minLength={2} maxLength={50} required
                    className={fieldClass}
                />
                {warnings.lastName && <p className="mt-1 text-sm text-red-600">{warnings.lastName}</p>}
            </div>

            {/* Student ID */}
            <div>
                <label htmlFor="studentId" className={labelClass}>Student ID</label>
                <input
                    id="studentId" name="studentId" type="text"
                    value={form.studentId} onChange={handleChange}
                    pattern="^[0-9]*$" required
                    className={fieldClass}
                />
                {warnings.studentId && <p className="mt-1 text-sm text-red-600">{warnings.studentId}</p>}
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <input
                    id="email" name="email" type="email"
                    value={form.email} onChange={handleChange}
                    required
                    className={fieldClass}
                />
                {warnings.email && <p className="mt-1 text-sm text-red-600">{warnings.email}</p>}
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <div className="flex gap-2 items-center">
                    <input
                        id="password" name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password} onChange={handleChange}
                        minLength={8} maxLength={50} required
                        className={fieldClass}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="shrink-0 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
                {warnings.password && <p className="mt-1 text-sm text-red-600">{warnings.password}</p>}
            </div>

            {/* Discipline */}
            <div>
                <label htmlFor="discipline" className={labelClass}>Discipline</label>
                <select
                    id="discipline" name="discipline"
                    value={form.discipline} onChange={handleChange}
                    required
                    className={fieldClass}
                >
                    <option value="">-- Select a discipline --</option>
                    {DISCIPLINES.map(d => (
                        <option key={d} value={d}>{d.replace('_', ' ')}</option>
                    ))}
                </select>
                {warnings.discipline && <p className="mt-1 text-sm text-red-600">{warnings.discipline}</p>}
            </div>

            <button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
                Create account
            </button>
        </form>
    );
};

export default Student;