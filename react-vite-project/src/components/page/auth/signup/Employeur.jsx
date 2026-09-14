import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Field, validateField,
    FirstNameField, LastNameField, EmailField, PasswordField, ConfirmPasswordField, SubmitButton,
} from "./CommonFields.jsx";

const DEFAULT_FORM = {
    nomEntreprise:   "",
    firstName:       "",
    lastName:        "",
    email:           "",
    telephone:       "",
    password:        "",
    confirmPassword: "",
};

const DEFAULT_WARNINGS = Object.fromEntries(Object.keys(DEFAULT_FORM).map(k => [k, ""]));

function isAllFilled(form) {
    return Object.values(form).every(v => v !== "");
}

const validateNomEntreprise = (value) => value.trim() ? "" : "Ce champ aest requis.";

const validateTelephone = (value) => {
    const t = value.trim();
    if (!t) return "Ce champ est requis.";
    if (t.replace(/\D/g, "").length < 10) return "Numéro de téléphone invalide.";
    return "";
};

const Employeur = ({ fieldClass, labelClass, errorClass, eyeClass, serverErrorClass, passwordHintClass, submitClass }) => {
    const navigate = useNavigate();
    const [form, setForm]                 = useState(DEFAULT_FORM);
    const [warnings, setWarnings]         = useState(DEFAULT_WARNINGS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [serverError, setServerError]   = useState("");
    const [loading, setLoading]           = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setServerError("");
        if (warnings[name]) {
            setWarnings(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateAll = () => {
        const newWarnings = {};
        let valid = true;
        Object.keys(DEFAULT_FORM).forEach(field => {
            let msg;
            if (field === "nomEntreprise") msg = validateNomEntreprise(form[field]);
            else if (field === "telephone") msg = validateTelephone(form[field]);
            else msg = validateField(field, form[field], form);
            newWarnings[field] = msg;
            if (msg) valid = false;
        });
        setWarnings(newWarnings);
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        if (!validateAll()) return;

        setLoading(true);
        setTimeout(() => {
            console.log({
                nomEntreprise: form.nomEntreprise.trim(),
                firstName:     form.firstName.trim(),
                lastName:      form.lastName.trim(),
                email:         form.email.trim().toLowerCase(),
                telephone:     form.telephone,
                password:      form.password,
            });
            setLoading(false);
            navigate("/login");
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {serverError && <div className={serverErrorClass}>{serverError}</div>}

            <Field id="nomEntreprise" label="Nom de l'entreprise" warning={warnings.nomEntreprise} labelClass={labelClass} errorClass={errorClass}>
                <input
                    id="nomEntreprise" name="nomEntreprise" type="text"
                    value={form.nomEntreprise} onChange={handleChange}
                    required className={fieldClass}
                />
            </Field>

            <FirstNameField
                value={form.firstName} onChange={handleChange} warning={warnings.firstName}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                label="Prénom du contact"
            />

            <LastNameField
                value={form.lastName} onChange={handleChange} warning={warnings.lastName}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                label="Nom du contact"
            />

            <EmailField
                value={form.email} onChange={handleChange} warning={warnings.email}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass}
                label="Courriel"
            />

            <Field id="telephone" label="Téléphone" warning={warnings.telephone} labelClass={labelClass} errorClass={errorClass}>
                <input
                    id="telephone" name="telephone" type="tel"
                    value={form.telephone} onChange={handleChange}
                    required className={fieldClass}
                />
            </Field>

            <PasswordField
                value={form.password} onChange={handleChange} warning={warnings.password}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass} eyeClass={eyeClass}
                show={showPassword} onToggleShow={() => setShowPassword(p => !p)}
                hint="8–50 caractères · chiffre · minuscule · majuscule · caractère spécial"
                passwordHintClass={passwordHintClass}
                label="Mot de passe"
            />

            <ConfirmPasswordField
                value={form.confirmPassword} onChange={handleChange} warning={warnings.confirmPassword}
                labelClass={labelClass} errorClass={errorClass} fieldClass={fieldClass} eyeClass={eyeClass}
                show={showConfirm} onToggleShow={() => setShowConfirm(p => !p)}
                label="Confirmer le mot de passe"
            />

            <SubmitButton
                disabled={!isAllFilled(form) || loading}
                loading={loading}
                loadingLabel="Inscription en cours…"
                label="S'inscrire"
                submitClass={submitClass}
            />

        </form>
    );
};

export default Employeur;