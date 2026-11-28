/**
 * SignEvaluationForm.jsx — Inline form to sign a workplace evaluation.
 *
 * The signer must tick "I accept the workplace evaluation" and confirm with the password
 * of their account. Nothing is sent when the box is unticked or the password is empty.
 * In Dev mode the password field is hidden (the dev endpoint needs no password).
 *
 * `onSubmit({termsAccepted, password})` returns {success: true} or
 * {success: false, message: {key, options?}} (translated here with translateWarning).
 * On success the form closes itself; on failure it keeps the box ticked and clears the password.
 *
 * Props
 *   dark      boolean
 *   devMode   boolean   hides the password field
 *   onSubmit  function  async ({termsAccepted, password}) => {success, message?}
 *   onClose   function  closes the form
 */

import {useId, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../styles/Button.jsx";
import {getAuthClasses, getInternshipFormClasses} from "../../styles/AppStyles.jsx";
import {PasswordField, translateWarning} from "../../utils/CommonFields.jsx";

function SignEvaluationForm({dark, devMode = false, onSubmit, onClose}) {
    const {t} = useTranslation();
    const s = getInternshipFormClasses(dark);
    const auth = getAuthClasses(dark);
    const termsId = useId();

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const passwordEmpty = !devMode && password.trim() === "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);

        if (!termsAccepted) return setError({key: "workplaceEvaluation.sign.errorTerms"});
        if (passwordEmpty) return setError({key: "workplaceEvaluation.sign.errorPassword"});

        setSubmitting(true);
        const result = await onSubmit({termsAccepted, password});
        setSubmitting(false);

        if (!result?.success) {
            setPassword("");
            return setError(result?.message ?? {key: "workplaceEvaluation.sign.errorFailed"});
        }

        // Success: never keep the password around
        setPassword("");
        onClose();
    };

    const muted = dark ? "text-slate-300" : "text-gray-700";

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={submitting}
            className={`space-y-4 rounded-lg border p-4 ${dark ? "border-slate-700 bg-slate-900/30" : "border-gray-200 bg-gray-50"}`}
        >
            <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
                {t("workplaceEvaluation.sign.title")}
            </h4>

            {/* One single red box for every error */}
            {error && (
                <div className={s.errorBanner} role="alert">
                    <span>{translateWarning(t, error)}</span>
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
                {t("workplaceEvaluation.sign.accept")}
            </label>

            {devMode ? (
                <p className={s.hint}>{t("workplaceEvaluation.sign.devHint")}</p>
            ) : (
                <PasswordField
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                    }}
                    labelClass={auth.labelClass}
                    errorClass={auth.errorClass}
                    fieldClass={auth.fieldClass}
                    eyeClass={auth.eyeClass}
                    show={showPassword}
                    onToggleShow={() => setShowPassword((shown) => !shown)}
                    hint={t("workplaceEvaluation.sign.passwordHint")}
                    passwordHintClass={auth.passwordHintClass}
                />
            )}

            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" tone="neutral" dark={dark} icon="close" disabled={submitting} onClick={onClose}>
                    {t("workplaceEvaluation.sign.cancel")}
                </Button>
                <Button type="submit" tone="success" dark={dark} icon="check"
                        disabled={submitting || passwordEmpty}>
                    {submitting ? t("workplaceEvaluation.sign.submitting") : t("workplaceEvaluation.sign.submit")}
                </Button>
            </div>
        </form>
    );
}

export default SignEvaluationForm;