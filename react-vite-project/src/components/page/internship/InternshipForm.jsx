import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getInternshipFormClasses} from '../../../styles/AppStyles.jsx';
import {Field, translateWarning} from '../../../utils/CommonFields.jsx';
import AutoResizeTextarea from '../../../utils/AutoResizeTextarea.jsx';

const INITIAL_FORM = {
    title: "",
    description: "",
    requiredSkills: "",
    durationInWeeks: "",
    location: "",
    workMode: "",
    startDate: "",
    applicationDeadline: "",
    compensationAmount: "",
};

const TRIMMED_FIELDS = ["title", "description", "requiredSkills", "location"];

const WORK_MODES = ["IN_PERSON", "HYBRID", "REMOTE"];

const COMPENSATION = {
    AMOUNT: "amount",
    UNPAID: "unpaid",
    TBD: "to_be_discussed",
};

const TITLE_MIN = 2;
const TITLE_MAX = 50;
const TEXT_MIN = 2;
const AMOUNT_REGEX = /^\d{1,2}(\.\d{1,2})?$/;

// en-CA renders YYYY-MM-DD, which is what <input type="date"> expects
const getTomorrow = () => new Date(Date.now() + 86400000).toLocaleDateString("en-CA");

const isUnpaid = (i) =>
    !i.compensationNegotiable && i.compensationAmount != null && Number(i.compensationAmount) === 0;

// Form state from an existing internship (edit mode) or an empty form (create mode)
const toForm = (i) => i ? {
    title: i.title ?? "",
    description: i.description ?? "",
    requiredSkills: i.requiredSkills ?? "",
    durationInWeeks: String(i.durationInWeeks ?? ""),
    location: i.location ?? "",
    workMode: i.workMode ?? "",
    startDate: i.startDate ?? "",
    applicationDeadline: i.applicationDeadline ?? "",
    compensationAmount: i.compensationNegotiable || i.compensationAmount == null || isUnpaid(i)
        ? "" : String(i.compensationAmount),
} : INITIAL_FORM;

const toSelection = (i) => {
    if (!i) return "";
    if (i.compensationNegotiable) return COMPENSATION.TBD;
    if (isUnpaid(i)) return COMPENSATION.UNPAID;
    return COMPENSATION.AMOUNT;
};

// "  React ,, Node " -> "React, Node"
const cleanSkills = (raw) =>
    raw.split(",").map((skill) => skill.trim()).filter(Boolean).join(", ");

/**
 * Validates the form and builds the API payload.
 * Returns {error: {key}} on the first problem, or {payload} when everything is valid.
 * In edit mode an unchanged (possibly now past) date is still accepted.
 */
function buildPayload(formData, selection, internship) {
    const tomorrow = getTomorrow();
    const isPastDate = (value, original) => value < tomorrow && value !== original;

    const title = formData.title.trim();
    const description = formData.description.trim();
    const location = formData.location.trim();
    const requiredSkills = cleanSkills(formData.requiredSkills);

    if (title.length < TITLE_MIN || title.length > TITLE_MAX) return {error: {key: "internshipModal.titleTooShort"}};
    if (requiredSkills.length === 0) return {error: {key: "internshipModal.errorSkills"}};
    if (description.length < TEXT_MIN || requiredSkills.length < TEXT_MIN || location.length < TEXT_MIN) {
        return {error: {key: "internshipModal.errorTooShort"}};
    }

    const durationInWeeks = Number(formData.durationInWeeks);
    if (!Number.isInteger(durationInWeeks) || durationInWeeks < 1) return {error: {key: "internshipModal.errorDuration"}};

    if (!WORK_MODES.includes(formData.workMode)) return {error: {key: "internshipModal.errorWorkMode"}};

    if (isPastDate(formData.startDate, internship?.startDate)
        || isPastDate(formData.applicationDeadline, internship?.applicationDeadline)) {
        return {error: {key: "internshipModal.errorDate"}};
    }

    // Compensation: amount | to be discussed | unpaid (sent as amount 0, not negotiable)
    if (selection === COMPENSATION.AMOUNT && !AMOUNT_REGEX.test(formData.compensationAmount)) {
        return {error: {key: "internshipModal.errorCompensation"}};
    }
    const compensationNegotiable = selection === COMPENSATION.TBD;
    let compensationAmount;
    if (compensationNegotiable) compensationAmount = null;
    else if (selection === COMPENSATION.UNPAID) compensationAmount = 0;
    else compensationAmount = Number(formData.compensationAmount);

    return {
        payload: {
            title, description, requiredSkills, durationInWeeks, location,
            workMode: formData.workMode,
            startDate: formData.startDate,
            applicationDeadline: formData.applicationDeadline,
            compensationAmount, compensationNegotiable,
        },
    };
}

export default function InternshipForm({onClose, onSubmitInternship, internship = null, dark}) {
    const {t} = useTranslation();
    const s = getInternshipFormClasses(dark);
    const isEdit = Boolean(internship);
    const tomorrow = getTomorrow();
    const minDate = isEdit ? undefined : tomorrow;

    const [formData, setFormData] = useState(() => toForm(internship));
    const [selection, setSelection] = useState(() => toSelection(internship));
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    // Changing the compensation type clears the typed amount
    const handleSelectionChange = (e) => {
        setSelection(e.target.value);
        setFormData((prev) => ({...prev, compensationAmount: ""}));
    };

    // Trim ONLY the spaces/newlines before the first and after the last character.
    const handleBlur = (e) => {
        const {name, value} = e.target;
        if (TRIMMED_FIELDS.includes(name) && value !== value.trim()) {
            setFormData((prev) => ({...prev, [name]: value.trim()}));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const {error: validationError, payload} = buildPayload(formData, selection, internship);
        if (validationError) return setError(validationError);

        const result = await onSubmitInternship(payload);

        // Failure: keep everything the user typed so nothing is lost
        if (!result?.success) return setError(result?.message || {key: "postInternship.createError"});

        // Success: close (the parent unmounts the form, which resets it)
        onClose();
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

                {/* Title */}
                <Field id="title" label={t("internshipModal.titleLabel")} labelClass={s.label}>
                    <input
                        id="title" type="text" name="title" value={formData.title}
                        onChange={handleChange} onBlur={handleBlur}
                        className={s.input} required autoFocus
                    />
                </Field>

                {/* Description: grows with its content */}
                <Field id="description" label={t("internshipModal.descriptionLabel")} labelClass={s.label}>
                    <AutoResizeTextarea
                        id="description" name="description" rows={3} value={formData.description}
                        onChange={handleChange} onBlur={handleBlur}
                        className={s.textarea} required
                    />
                </Field>

                {/* Required skills */}
                <div>
                    <Field id="requiredSkills" label={t("internshipModal.skillsLabel")} labelClass={s.label}>
                        <input
                            id="requiredSkills" type="text" name="requiredSkills" value={formData.requiredSkills}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder={t("internshipModal.skillsPlaceholder")}
                            className={s.input} required
                        />
                    </Field>
                    <p className={s.hint}>{t("internshipModal.skillsHint")}</p>
                </div>

                {/* Duration + Location */}
                <div className={s.grid2}>
                    <Field id="durationInWeeks" label={t("internshipModal.durationLabel")} labelClass={s.label}>
                        <input
                            id="durationInWeeks" type="number" name="durationInWeeks" min="1"
                            value={formData.durationInWeeks} onChange={handleChange}
                            placeholder={t("internshipModal.durationPlaceholder")}
                            className={s.input} required
                        />
                    </Field>
                    <Field id="location" label={t("internshipModal.locationLabel")} labelClass={s.label}>
                        <input
                            id="location" type="text" name="location" value={formData.location}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder={t("internshipModal.locationPlaceholder")}
                            className={s.input} required
                        />
                    </Field>
                </div>

                {/* Work mode */}
                <Field id="workMode" label={t("internshipModal.workModeLabel")} labelClass={s.label}>
                    <select
                        id="workMode" name="workMode" value={formData.workMode}
                        onChange={handleChange} className={s.input} required
                    >
                        <option value="" disabled>{t("internshipModal.selectPlaceholder")}</option>
                        {WORK_MODES.map((value) => (
                            <option key={value} value={value}>{t(`internshipModal.workModes.${value}`)}</option>
                        ))}
                    </select>
                </Field>

                {/* Start date + Deadline */}
                <div className={s.grid2}>
                    <Field id="startDate" label={t("internshipModal.startDateLabel")} labelClass={s.label}>
                        <input
                            id="startDate" type="date" name="startDate" value={formData.startDate}
                            min={minDate} onChange={handleChange}
                            className={s.input} required
                        />
                    </Field>
                    <Field id="applicationDeadline" label={t("internshipModal.deadlineLabel")} labelClass={s.label}>
                        <input
                            id="applicationDeadline" type="date" name="applicationDeadline"
                            value={formData.applicationDeadline} min={minDate} onChange={handleChange}
                            className={s.input} required
                        />
                    </Field>
                </div>

                {/* Compensation */}
                <Field id="selection" label={t("internshipModal.compensationLabel")} labelClass={s.label}>
                    <select
                        id="selection" name="selection" value={selection}
                        onChange={handleSelectionChange} className={s.input} required
                    >
                        <option value="" disabled>{t("internshipModal.selectPlaceholder")}</option>
                        <option value={COMPENSATION.AMOUNT}>{t("internshipModal.amountOption")}</option>
                        <option value={COMPENSATION.UNPAID}>{t("internshipModal.unpaidOption")}</option>
                        <option value={COMPENSATION.TBD}>{t("internshipModal.tbdOption")}</option>
                    </select>
                </Field>

                {selection === COMPENSATION.AMOUNT && (
                    <Field id="compensationAmount" label={t("internshipModal.amountLabel")} labelClass={s.label}>
                        <input
                            id="compensationAmount" type="number" name="compensationAmount"
                            value={formData.compensationAmount} onChange={handleChange}
                            className={s.input}
                            placeholder={t("internshipModal.compensationPlaceholder")}
                            min="0" step="any" required
                        />
                    </Field>
                )}

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
    );
}
