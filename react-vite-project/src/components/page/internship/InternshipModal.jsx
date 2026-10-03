import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getInternshipModalClasses} from '../../../styles/AppStyles.jsx';
import Icon from '../../../styles/Icon.jsx';
import {translateWarning} from '../../../utils/CommonFields.jsx';
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
    compensationAmount: ""
};

const TRIMMED_FIELDS = ["title", "description", "requiredSkills", "location"];

const WORK_MODES = [
    {value: "IN_PERSON", label: "In person"},
    {value: "HYBRID", label: "Hybrid"},
    {value: "REMOTE", label: "Remote"},
];

const isUnpaid = (i) => !i.compensationNegotiable && i.compensationAmount != null && Number(i.compensationAmount) === 0;

// Build the form state from an existing internship (edit mode) or an empty form (create mode)
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

// "" | "amount" | "to_be_discussed" | "unpaid"
const toSelection = (i) => {
    if (!i) return "";
    if (i.compensationNegotiable) return "to_be_discussed";
    if (isUnpaid(i)) return "unpaid";
    return "amount";
};

/**
 * Props
 *   internship  object | null   when set, the modal edits this offer
 *   onSubmitInternship(payload) -> Promise<{success, message?}>
 */
export default function InternshipModal({isOpen, onClose, onSubmitInternship, internship = null, dark}) {
    const {t} = useTranslation();
    const s = getInternshipModalClasses(dark);
    const isEdit = Boolean(internship);

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [error, setError] = useState("");
    const [selection, setSelection] = useState("");

    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA");

    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setSelection("");
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Each time the modal opens: empty for create, pre-filled for edit
    useEffect(() => {
        if (!isOpen) return;
        setFormData(toForm(internship));
        setSelection(toSelection(internship));
        setError("");
    }, [isOpen, internship]);

    if (!isOpen) return null;

    const handleSelectionChange = (e) => {
        setSelection(e.target.value);
        setFormData((prev) => ({...prev, compensationAmount: ""}));
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    // Trim ONLY the spaces/newlines before the first and after the last character.
    // Spaces inside the text are left untouched.
    const handleBlur = (e) => {
        const {name, value} = e.target;
        if (TRIMMED_FIELDS.includes(name) && value !== value.trim()) {
            setFormData((prev) => ({...prev, [name]: value.trim()}));
        }
    };

    // In edit mode an unchanged (possibly now past) date is still accepted
    const isPastDate = (value, original) => value < tomorrow && value !== original;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const title = formData.title.trim();
        const description = formData.description.trim();
        const location = formData.location.trim();
        const requiredSkills = formData.requiredSkills.split(",").map((skill) => skill.trim()).filter((skill) => skill.length > 0).join(", ");

        if (title.length < 2 || title.length > 50) return setError({key: "internshipModal.titleTooShort"});
        if (requiredSkills.length === 0) return setError({key: "internshipModal.errorSkills"});
        if (description.length < 2 || requiredSkills.length < 2 || location.length < 2) return setError({key: "internshipModal.errorTooShort"});

        const durationInWeeks = Number(formData.durationInWeeks);
        if (!Number.isInteger(durationInWeeks) || durationInWeeks < 1) return setError({key: "internshipModal.errorDuration"});

        if (!WORK_MODES.some((m) => m.value === formData.workMode)) return setError("Please choose a work mode.");

        if (isPastDate(formData.startDate, internship?.startDate)
            || isPastDate(formData.applicationDeadline, internship?.applicationDeadline)) {
            return setError({key: "internshipModal.errorDate"});
        }

        // Compensation: amount | to be discussed | unpaid (sent as amount 0, not negotiable)
        const compensationNegotiable = selection === "to_be_discussed";
        const unpaid = selection === "unpaid";
        if (selection === "amount" && !/^\d{1,2}(\.\d{1,2})?$/.test(formData.compensationAmount)) {
            return setError({key: "internshipModal.errorCompensation"});
        }
        let compensationAmount;
        if (compensationNegotiable) compensationAmount = null;
        else if (unpaid) compensationAmount = 0;
        else compensationAmount = Number(formData.compensationAmount);

        const payload = {
            title, description, requiredSkills, durationInWeeks, location,
            workMode: formData.workMode,
            startDate: formData.startDate,
            applicationDeadline: formData.applicationDeadline,
            compensationAmount, compensationNegotiable,
        };

        const result = await onSubmitInternship(payload);

        // Failure: keep everything the user typed so nothing is lost
        if (!result?.success) return setError(result?.message || {key: "postInternship.createError"});

        // Success: reset every field, then close
        handleClose();
    };

    return (
        <div className={s.overlay}>
            <div className={s.panel}>
                {/* Header */}
                <div className={s.header}>
                    <h2 className={s.title}>{isEdit ? "Edit internship" : t("internshipModal.title")}</h2>
                    <button type="button" onClick={handleClose} className={s.closeBtn}
                            aria-label={t("internshipModal.closeAria")}>
                        <Icon name="close"/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className={s.errorBanner}>
                            <span>{translateWarning(t, error)}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className={s.label}>{t("internshipModal.titleLabel")}</label>
                        <input
                            type="text" name="title" value={formData.title}
                            onChange={handleChange} onBlur={handleBlur}
                            className={s.input} required
                        />
                    </div>

                    {/* Description: grows with its content */}
                    <div>
                        <label className={s.label}>{t("internshipModal.descriptionLabel")}</label>
                        <AutoResizeTextarea
                            name="description" rows={3} value={formData.description}
                            onChange={handleChange} onBlur={handleBlur}
                            className={s.textarea} required
                        />
                    </div>

                    {/* Required skills */}
                    <div>
                        <label className={s.label}>{t("internshipModal.skillsLabel")}</label>
                        <input
                            type="text" name="requiredSkills" value={formData.requiredSkills}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder={t("internshipModal.skillsPlaceholder")}
                            className={s.input} required
                        />
                        <p className={s.hint}>{t("internshipModal.skillsHint")}</p>
                    </div>

                    {/* Duration + Location */}
                    <div className={s.grid2}>
                        <div>
                            <label className={s.label}>{t("internshipModal.durationLabel")}</label>
                            <input
                                type="number" name="durationInWeeks" min="1" value={formData.durationInWeeks}
                                onChange={handleChange} placeholder={t("internshipModal.durationPlaceholder")}
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>{t("internshipModal.locationLabel")}</label>
                            <input
                                type="text" name="location" value={formData.location}
                                onChange={handleChange} onBlur={handleBlur}
                                placeholder={t("internshipModal.locationPlaceholder")}
                                className={s.input} required
                            />
                        </div>
                    </div>

                    {/* Work mode */}
                    <div>
                        <label className={s.label}>Work mode:</label>
                        <select
                            name="workMode"
                            value={formData.workMode}
                            onChange={handleChange}
                            className={s.input}
                            required
                        >
                            <option value="" disabled>Choose an option...</option>
                            {WORK_MODES.map(({value, label}) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start date + Deadline */}
                    <div className={s.grid2}>
                        <div>
                            <label className={s.label}>{t("internshipModal.startDateLabel")}</label>
                            <input
                                type="date" name="startDate" value={formData.startDate}
                                min={isEdit ? undefined : tomorrow} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>{t("internshipModal.deadlineLabel")}</label>
                            <input
                                type="date" name="applicationDeadline"
                                min={isEdit ? undefined : tomorrow}
                                value={formData.applicationDeadline} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={s.label}>{t("internshipModal.compensationLabel")}</label>
                        <select
                            name="selection"
                            value={selection}
                            onChange={handleSelectionChange}
                            className={s.input}
                            required
                        >
                            <option value="" disabled>{t("internshipModal.selectPlaceholder")}</option>
                            <option value="amount">{t("internshipModal.amountOption")}</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="to_be_discussed">{t("internshipModal.tbdOption")}</option>
                        </select>
                    </div>

                    {selection === 'amount' && (
                        <div style={{marginTop: '1rem'}}>
                            <label className={s.label}>{t("internshipModal.amountLabel")}</label>
                            <input
                                type="number"
                                name="compensationAmount"
                                value={formData.compensationAmount}
                                onChange={handleChange}
                                className={s.input}
                                placeholder={t("internshipModal.compensationPlaceholder")}
                                min="0"
                                step="any"
                                required
                            />
                        </div>)}

                    {/* Footer */}
                    <div className={s.footer}>
                        <button type="button" onClick={handleClose} className={s.cancelBtn}>
                            {t("internshipModal.cancelBtn")}
                        </button>
                        <button type="submit" className={s.submitBtn}>
                            {isEdit ? "Save changes" : t("internshipModal.submitBtn")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}