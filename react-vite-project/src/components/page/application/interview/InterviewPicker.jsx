import {getApplicationCardClasses, getInternshipFormClasses} from "../../../../styles/AppStyles.jsx";
import {useTranslation} from "react-i18next";
import {Field, translateWarning} from "../../../../utils/CommonFields.jsx";
import {useState} from "react";
import AutoResizeTextarea from "../../../../utils/AutoResizeTextarea.jsx";

const INITIAL_FORM = {
    date: "",
    message: "",
};

const toForm = (i) => i ? {
    date: i.date ?? "",
    message: i.message ?? "",
} : INITIAL_FORM;

function buildPayload(formData, internship) {
    const tomorrow = getTomorrow();
    const isPastDate = (value, original) => value < tomorrow && value !== original;

    const message = formData.message.trim();

    if (isPastDate(formData.date, internship?.date)) {
        return {error: {key: "internshipModal.errorDate"}};
    }

    return {
        payload: {
            date: formData.date,
            message: message,
        },
    };
}

const getTomorrow = () => new Date(Date.now() + 86400000).toLocaleDateString("en-CA");

function InterviewPicker({application = null, dark, isEdit, onClose, onSendOffer}){
    const s = getInternshipFormClasses(dark);
    const {t} = useTranslation();
    const [error, setError] = useState(null);
    const tomorrow = getTomorrow();
    const isPastDate = (value, original) => value < tomorrow && value !== original;
    const [formData, setFormData] = useState(() => INITIAL_FORM);
    const minDate = tomorrow;


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const {error: validationError, payload} = buildPayload(formData, application);
        if (validationError) return setError(validationError);

        const result = await onSendOffer(payload);

        // Failure: keep everything the user typed so nothing is lost
        if (!result?.success) return setError(result?.message || {key: "postInternship.createError"});

        // Success: close (the parent unmounts the form, which resets it)
        onClose();
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    return (
        <section className={s.wrapper}>
            <div className={s.header}>
                <h2 className={s.title}>{isEdit ? t("internshipModal.editTitle") : t("internshipModal.title")}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className={s.errorBanner} role="alert">
                        <span>{translateWarning(t, error)}</span>
                    </div>
                )}

                {/* Date */}
                <div className={s.grid2}>
                    <Field id="date" label={t("internshipModal.startDateLabel")} labelClass={s.label}>
                        <input
                            id="date" type="date" name="date" value={formData.startDate}
                            min={minDate} onChange={handleChange}
                            className={s.input} required
                        />
                    </Field>
                </div>

                {/* Message: grows with its content */}
                <Field id="message" label={t("internshipModal.descriptionLabel")} labelClass={s.label}>
                    <AutoResizeTextarea
                        id="message" name="message" rows={3} value={formData.description}
                        onChange={handleChange}
                        className={s.textarea}
                    />
                </Field>

                {/* Footer */}
                <div className={s.footer}>
                    <button type="button" onClick={onClose} className={s.cancelBtn}>
                        {t("internshipModal.cancelBtn")}
                    </button>
                    <button type="submit" className={s.submitBtn}>
                        {isEdit ? t("internshipModal.saveChanges") : t("internshipModal.submitBtn")}
                    </button>
                </div>
            </form>
        </section>
    )
}

export default InterviewPicker;