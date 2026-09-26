import {useTranslation} from 'react-i18next';

export const RoleField = ({
    value, onChange, labelClass, errorClass, fieldClass,
    label = "Role", options = [], loading = false, fetchError = "",
}) => {
    const {t} = useTranslation();
    const roleOptions = options.map(v => ({value: v, label: t(`signup.${v}`)}));
    return (
        <Field id="role" label={label} warning={fetchError} labelClass={labelClass} errorClass={errorClass}>
            <select
                id="role" name="role"
                value={value} onChange={onChange}
                className={fieldClass}
                disabled={loading}
            >
                <option value="">
                    {loading ? t("commonFields.loading") : fetchError ? t("commonFields.fetchError") : t("commonFields.selectXText", {selectType: label.toLowerCase()})}
                </option>
                {roleOptions.map(({value: v, label: l}) => (
                    <option key={v} value={v}>{l}</option>
                ))}
            </select>
        </Field>
    );
};

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])\S+$/;
export const NAME_REGEX = /^(?=.*\p{L})[\p{L}\p{M}'’\-. ]+$/u;

const NAME_DISALLOWED = /[^\p{L}\p{M}'’\-. ]/gu;
const EMAIL_DISALLOWED = /[^A-Za-z0-9._%+\-@]/g;
const PASSWORD_DISALLOWED = /\s/g;

export const sanitizeName = (v) => v.replace(NAME_DISALLOWED, "");

export const sanitizeEmail = (v) => {
    const cleaned = v.replace(EMAIL_DISALLOWED, "");
    const at = cleaned.indexOf("@");
    if (at === -1) return cleaned;

    const local = cleaned.slice(0, at);
    // Everything after the first @ is the domain: drop extra @ and _ % +
    const domain = cleaned.slice(at + 1).replace(/[^A-Za-z0-9.-]/g, "");
    return `${local}@${domain}`;
};

export const sanitizePassword = (v) => v.replace(PASSWORD_DISALLOWED, "");

// Wraps a form's onChange so the value is cleaned before it reaches state
const withSanitizer = (sanitize, onChange) => (e) => {
    const {name, value} = e.target;
    onChange({target: {name, value: sanitize(value)}});
};

export const validateDiscipline = (value) => value ? "" : {key:"commonFields.disciplineSelect"};

export const validateId = (value, length = 7) => {
    const trimmed = value.trim();
    if (!trimmed) return {key:"commonFields.requiredId"};
    if (trimmed.length !== length) return {key:"commonFields.requiredIdLength", options:{length}};
    return "";
};

export function validateField(field, value, formValues = {}) {
    switch (field) {
        case "firstName":
        case "lastName": {
            const tr = value.trim();
            if (!tr) return {key:"commonFields.requiredField"}
            if (tr.length < 2) return {key:"commonFields.atLeastXCharacters", options: {amount: 2}};
            if (tr.length > 50) return {key:"commonFields.atMostXCharacters", options: {amount: 50}};
            if (!NAME_REGEX.test(tr)) return {key:"commonFields.nameRequirements"};
            return "";
        }
        case "email": {
            const tr = value.trim();
            if (!tr) return {key:"commonFields.requiredEmail"};
            if (tr.length > 100) return {key:"commonFields.atMostXCharacters", options:{amount: 100}};
            if (!EMAIL_REGEX.test(tr)) return {key:"commonFields.invalidEmailFormat"};
            return "";
        }
        case "password": {
            if (!value) return {key: "commonFields.requiredPassword"};
            if (value.length < 8) return {key: "commonFields.atLeastXCharacters", options: {amount: 8}};
            if (value.length > 50) return {key: "commonFields.atMostXCharacters", options: {amount: 50}};
            if (/\s/.test(value)) return {key: "commonFields.mustNotContainSpaces"};
            if (!PASSWORD_REGEX.test(value)) {
                const missing = [];
                if (!/[0-9]/.test(value)) missing.push("commonFields.missingDigit");
                if (!/[a-z]/.test(value)) missing.push("commonFields.missingLowercaseLetter");
                if (!/[A-Z]/.test(value)) missing.push("commonFields.missingUppercaseLetter");
                if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(value)) missing.push("commonFields.missingSpecialCharacter");
                return {key: "commonFields.missingComposite", missing};
            }
            return "";
        }
        case "confirmPassword":
            if (!value) return {key:"commonFields.missingConfirmPassword"};
            if (value !== formValues.password) return {key:"commonFields.noMatchingPasswords"};
            return "";
        case "discipline":
            return validateDiscipline(value);
        case "studentId":
            return validateId(value, 7);
        case "teacherId":
            return validateId(value, 5);
        default:
            return "";
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
    role = "Student",
    name = "studentId",
    limit = 7,
}) => {
    const {t} = useTranslation();
    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, limit);
        onChange({target: {name, value: digits}});
    };

    const labelKey = name === "teacherId" ? "commonFields.teacherIdLabel" : "commonFields.studentIdLabel";

    return (
        <Field id={name} label={t(labelKey)} warning={warning} labelClass={labelClass} errorClass={errorClass}>
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

export const FirstNameField = ({value, onChange, warning, labelClass, errorClass, fieldClass}) => {
    const {t} = useTranslation();
    return (
        <Field id="firstName" label={t("commonFields.firstName")} warning={warning} labelClass={labelClass}
               errorClass={errorClass}>
            <input
                id="firstName" name="firstName" type="text"
                value={value} onChange={withSanitizer(sanitizeName, onChange)}
                maxLength={50} required className={fieldClass}
            />
        </Field>
    );
};

export const LastNameField = ({value, onChange, warning, labelClass, errorClass, fieldClass}) => {
    const {t} = useTranslation();
    return (
        <Field id="lastName" label={t("commonFields.lastName")} warning={warning} labelClass={labelClass}
               errorClass={errorClass}>
            <input
                id="lastName" name="lastName" type="text"
                value={value} onChange={withSanitizer(sanitizeName, onChange)}
                maxLength={50} required className={fieldClass}
            />
        </Field>
    );
};

export const EmailField = ({value, onChange, warning, labelClass, errorClass, fieldClass}) => {
    const {t} = useTranslation();
    return (
        <Field id="email" label={t("commonFields.email")} warning={warning} labelClass={labelClass}
               errorClass={errorClass}>
            <input
                id="email" name="email" type="email"
                value={value} onChange={withSanitizer(sanitizeEmail, onChange)}
                maxLength={100} required className={fieldClass}
            />
        </Field>
    );
};

export const DisciplineField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass,
    options = [], loading = false, fetchError = "", name = "discipline",
    label,
}) => {
    const {t} = useTranslation();

    const effectiveLabel = label ?? t("commonFields.discipline");

    const disciplineOptions = options.map(({value: v}) => ({
        value: v,
        label: t(`disciplines.${v.toLowerCase()}`),
    }));

    return (
        <Field id="discipline" label={effectiveLabel} warning={warning} labelClass={labelClass}
               errorClass={errorClass} name={name}>
            <select
                id="discipline" name={name}
                value={value} onChange={onChange}
                required className={fieldClass}
                disabled={loading}
            >
                <option value="">
                    {loading ? t("commonFields.loading") : fetchError ? t("commonFields.fetchError") : t("commonFields.selectDisciplineText")}
                </option>
                {disciplineOptions.map(({value: v, label: l}) => (
                    <option key={v} value={v}>{l}</option>
                ))}
            </select>
            {fetchError && <p className={errorClass}>{fetchError}</p>}
        </Field>
    );
};

export const PasswordField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass, eyeClass,
    show, onToggleShow, hint, passwordHintClass,
}) => {
    const {t} = useTranslation();
    return (
        <Field id="password" label={t("commonFields.password")} warning={warning} labelClass={labelClass}
               errorClass={errorClass}>
            <div className="flex gap-2">
                <input
                    id="password" name="password"
                    type={show ? "text" : "password"}
                    value={value} onChange={withSanitizer(sanitizePassword, onChange)}
                    maxLength={50} required className={fieldClass}
                />
                <button type="button" onClick={onToggleShow}
                        aria-label={show ? t("commonFields.hidePassword") : t("commonFields.showPassword")}
                        className={eyeClass}>
                    <EyeIcon open={show}/>
                </button>
            </div>
            {hint && <p className={passwordHintClass}>{hint}</p>}
        </Field>
    );
};

export const ConfirmPasswordField = ({
    value, onChange, warning, labelClass, errorClass, fieldClass, eyeClass,
    show, onToggleShow,
}) => {
    const {t} = useTranslation();
    return (
        <Field id="confirmPassword" label={t("commonFields.confirmPassword")} warning={warning} labelClass={labelClass}
               errorClass={errorClass}>
            <div className="flex gap-2">
                <input
                    id="confirmPassword" name="confirmPassword"
                    type={show ? "text" : "password"}
                    value={value} onChange={withSanitizer(sanitizePassword, onChange)}
                    required className={fieldClass}
                />
                <button type="button" onClick={onToggleShow}
                        aria-label={show ? t("commonFields.hideConfirmation") : t("commonFields.showConfirmation")}
                        className={eyeClass}>
                    <EyeIcon open={show}/>
                </button>
            </div>
        </Field>
    );
};

export const SubmitButton = ({disabled, loading, loadingLabel, label, submitClass}) => (
    <button
        type="submit"
        disabled={disabled}
        className={submitClass}
    >
        {loading ? loadingLabel : label}
    </button>
);

export function translateWarning(t, warning) {
    if (!warning) return "";
    if (warning.key === "commonFields.missingComposite") {
        return `Missing: ${warning.missingKeys.map(k => t(k)).join(", ")}.`;
    }
    return t(warning.key, warning.options);
}