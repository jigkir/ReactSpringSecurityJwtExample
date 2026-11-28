import {useId, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import {getAuthClasses, getInternshipFormClasses} from "../../../styles/theme/AppStyles.jsx";
import {PasswordField, translateWarning} from "../../../utils/forms/CommonFields.jsx";

export default function SignForm({dark, devMode = false, onSubmit, onClose, i18nPrefix, fallbackErrorKey}) {
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;
        setError(null);
        if (!termsAccepted) return setError({key: `${i18nPrefix}.sign.errorTerms`});
        if (passwordEmpty) return setError({key: `${i18nPrefix}.sign.errorPassword`});
        setSubmitting(true);
        const result = await onSubmit({termsAccepted, password});
        setSubmitting(false);
        if (!result?.success) {
            setPassword("");
            return setError(result?.message ?? {key: fallbackErrorKey});
        }
        setPassword("");
        onClose();
    };

    const muted = dark ? "text-slate-300" : "text-gray-700";
    return (
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}
              className={`space-y-4 rounded-lg border p-4 ${dark ? "border-slate-700 bg-slate-900/30" : "border-gray-200 bg-gray-50"}`}>
            <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{t(`${i18nPrefix}.sign.title`)}</h4>
            {error && <div className={s.errorBanner} role="alert"><span>{translateWarning(t, error)}</span></div>}
            <label htmlFor={termsId} className={`flex cursor-pointer items-start gap-2 text-sm font-medium ${muted}`}>
                <input id={termsId} type="checkbox" checked={termsAccepted} disabled={submitting}
                       onChange={(event) => { setTermsAccepted(event.target.checked); setError(null); }}
                       className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"/>
                {t(`${i18nPrefix}.sign.accept`)}
            </label>
            {devMode ? (
                <p className={s.hint}>{t(`${i18nPrefix}.sign.devHint`)}</p>
            ) : (
                <PasswordField value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }}
                               labelClass={auth.labelClass} errorClass={auth.errorClass} fieldClass={auth.fieldClass}
                               eyeClass={auth.eyeClass} show={showPassword}
                               onToggleShow={() => setShowPassword((shown) => !shown)}
                               hint={t(`${i18nPrefix}.sign.passwordHint`)} passwordHintClass={auth.passwordHintClass}/>
            )}
            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" tone="neutral" dark={dark} icon="close" disabled={submitting} onClick={onClose}>
                    {t(`${i18nPrefix}.sign.cancel`)}
                </Button>
                <Button type="submit" tone="success" dark={dark} icon="check" disabled={submitting || passwordEmpty}>
                    {submitting ? t(`${i18nPrefix}.sign.submitting`) : t(`${i18nPrefix}.sign.submit`)}
                </Button>
            </div>
        </form>
    );
}
