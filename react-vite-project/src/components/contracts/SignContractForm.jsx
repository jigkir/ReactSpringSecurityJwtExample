/**
 * SignContractForm.jsx — Inline form to sign a contract (manager, employer or student).
 *
 * The signer must tick "I accept the terms of the contract" and confirm with the password of
 * their account. Nothing is sent when the box is unticked or the password is empty.
 * In Dev mode the password field is hidden (the dev endpoint needs no password).
 *
 * `onSubmit({termsAccepted, password})` returns {success: true} or
 * {success: false, message: {key, options?}} (translated here with translateWarning).
 * On success the form closes itself; on failure it keeps the box ticked and clears the password.
 *
 * Password problems (empty or incorrect password) are shown under the password field;
 * every other problem is shown in the banner at the top of the form.
 *
 * Props
 *   dark      boolean
 *   devMode   boolean   hides the password field
 *   onSubmit  function  async ({termsAccepted, password}) => {success, message?}
 *   onClose   function  closes the form
 */

import {useId, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import {getInternshipFormClasses} from '../../styles/AppStyles.jsx';
import {Field, translateWarning} from '../../utils/CommonFields.jsx';

// Errors that belong under the password field
const PASSWORD_ERROR_KEYS = new Set([
    "managerContracts.sign.errorPassword",
    "managerContracts.sign.errorWrongPassword",
]);

function SignContractForm({dark, devMode = false, onSubmit, onClose}) {
    const {t} = useTranslation();
    const s = getInternshipFormClasses(dark);
    const termsId = useId();
    const passwordId = useId();

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);

        if (!termsAccepted) return setError({key: "managerContracts.sign.errorTerms"});
        if (!devMode && password.trim() === "") return setError({key: "managerContracts.sign.errorPassword"});

        setSubmitting(true);
        const result = await onSubmit({termsAccepted, password});
        setSubmitting(false);

        if (!result?.success) {
            setPassword("");
            return setError(result?.message ?? {key: "managerContracts.actionFailed"});
        }

        // Success: never keep the password around
        setPassword("");
        onClose();
    };

    const muted = dark ? "text-slate-300" : "text-gray-700";
    const fieldErrorClass = `mt-1 text-xs ${dark ? "text-red-400" : "text-red-600"}`;

    const passwordError = !devMode && error && PASSWORD_ERROR_KEYS.has(error.key) ? error : null;
    const bannerError = error && !passwordError ? error : null;

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={submitting}
            className={`space-y-4 rounded-lg border p-4 ${dark ? "border-slate-700 bg-slate-900/30" : "border-gray-200 bg-gray-50"}`}
        >
            <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
                {t("managerContracts.sign.title")}
            </h4>

            {bannerError && (
                <div className={s.errorBanner} role="alert">
                    <span>{translateWarning(t, bannerError)}</span>
                </div>
            )}

            <label htmlFor={termsId} className={`flex cursor-pointer items-start gap-2 text-sm font-medium ${muted}`}>
                <input
                    id={termsId}
                    type="checkbox"
                    checked={termsAccepted}
                    disabled={submitting}
                    onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        setError(null);
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
                />
                {t("managerContracts.sign.accept")}
            </label>

            {devMode ? (
                <p className={s.hint}>{t("managerContracts.sign.devHint")}</p>
            ) : (
                <div>
                    <Field
                        id={passwordId}
                        label={t("managerContracts.sign.passwordLabel")}
                        labelClass={s.label}
                        errorClass={fieldErrorClass}
                        warning={passwordError ? translateWarning(t, passwordError) : ""}
                    >
                        <input
                            id={passwordId}
                            type="password"
                            name="signaturePassword"
                            autoComplete="current-password"
                            value={password}
                            disabled={submitting}
                            aria-invalid={Boolean(passwordError)}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(null);
                            }}
                            className={s.input}
                        />
                    </Field>
                    <p className={s.hint}>{t("managerContracts.sign.passwordHint")}</p>
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" tone="neutral" dark={dark} icon="close" disabled={submitting} onClick={onClose}>
                    {t("managerContracts.sign.cancel")}
                </Button>
                <Button type="submit" tone="success" dark={dark} icon="check" disabled={submitting}>
                    {submitting ? t("managerContracts.sign.submitting") : t("managerContracts.sign.submit")}
                </Button>
            </div>
        </form>
    );
}

export default SignContractForm;
