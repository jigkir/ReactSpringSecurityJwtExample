import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getInternshipModalClasses} from '../../../styles/appStyles.jsx';
import Icon from '../../../styles/Icon.jsx';

const INITIAL_FORM = {
    title: "",
    description: "",
    requiredSkills: "",
    durationInWeeks: "",
    location: "",
    startDate: "",
    applicationDeadline: "",
    compensationAmount: ""
};

export default function InternshipModal({isOpen, onClose, onAddInternship, user, dark}) {
    const {t} = useTranslation();
    const s = getInternshipModalClasses(dark);

    const [formData, setFormData] = useState(INITIAL_FORM);

    const [error, setError] = useState("");

    const [selection, setSelection] = useState("");

    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA");

    if (!isOpen) return null;

    const handleSelectionChange = (e) => {
        setSelection(e.target.value);
        setFormData((prev) => ({...prev, compensationAmount: ""}));
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
        console.log(formData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const title = formData.title.trim();
        const description = formData.description.trim();
        const location = formData.location.trim();
        const requiredSkills = formData.requiredSkills.split(",").map((skill) => skill.trim()).filter((skill) => skill.length > 0).join(", ");

        if (title.length < 2 || title.length > 50) return setError(t("internshipModal.titleTooShort"));
        if (requiredSkills.length === 0) return setError(t("internshipModal.errorSkills"));
        if (description.length < 2 || requiredSkills.length < 2 || location.length < 2) return setError(t("internshipModal.errorTooShort"));

        const durationInWeeks = Number(formData.durationInWeeks);
        if (!Number.isInteger(durationInWeeks) || durationInWeeks < 1) return setError(t("internshipModal.errorDuration"));

        if (formData.startDate < tomorrow || formData.applicationDeadline < tomorrow) return setError(t("internshipModal.errorDate"));

        const compensationNegotiable = selection === "to_be_discussed";
        if (!compensationNegotiable && !/^\d{1,2}(\.\d{1,2})?$/.test(formData.compensationAmount)) return setError(t("internshipModal.errorCompensation"));
        const compensationAmount = compensationNegotiable ? null : Number(formData.compensationAmount);

        const newInternship = {title, description, requiredSkills, durationInWeeks, location, startDate: formData.startDate, applicationDeadline: formData.applicationDeadline, compensationAmount, compensationNegotiable};

        const result = await onAddInternship(newInternship);
        if (!result?.success) return setError(result?.message || t("postInternship.createError"));

        setFormData(INITIAL_FORM);
        setSelection("");
        onClose();
    };

    return (
        <div className={s.overlay}>
            <div className={s.panel}>
                {/* Header */}
                <div className={s.header}>
                    <h2 className={s.title}>{t("internshipModal.title")}</h2>
                    <button type="button" onClick={onClose} className={s.closeBtn} aria-label="Close">
                        <Icon name="close"/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className={s.errorBanner}>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className={s.label}>{t("internshipModal.titleLabel")}</label>
                        <input
                            type="text" name="title" value={formData.title}
                            onChange={handleChange} className={s.input} required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={s.label}>{t("internshipModal.descriptionLabel")}</label>
                        <textarea
                            name="description" rows="3" value={formData.description}
                            onChange={handleChange} className={s.textarea} required
                        />
                    </div>

                    {/* Required skills */}
                    <div>
                        <label className={s.label}>{t("internshipModal.skillsLabel")}</label>
                        <input
                            type="text" name="requiredSkills" value={formData.requiredSkills}
                            onChange={handleChange} placeholder={t("internshipModal.skillsPlaceholder")}
                            className={s.input} required
                        />
                        <p className={s.hint}>{t("internshipModal.skillsHint")}</p>
                    </div>

                    {/* Duration + Location */}
                    <div className={s.grid2}>
                        <div>
                            <label className={s.label}>{t("internshipModal.durationLabel")}</label>
                            <input
                                type="number" name="durationInWeeks" min="1" value={formData.duration}
                                onChange={handleChange} placeholder={t("internshipModal.durationPlaceholder")}
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>{t("internshipModal.locationLabel")}</label>
                            <input
                                type="text" name="location" value={formData.location}
                                onChange={handleChange} placeholder={t("internshipModal.locationPlaceholder")}
                                className={s.input} required
                            />
                        </div>
                    </div>

                    {/* Start date + Deadline */}
                    <div className={s.grid2}>
                        <div>
                            <label className={s.label}>{t("internshipModal.startDateLabel")}</label>
                            <input
                                type="date" name="startDate" value={formData.startDate}
                                min={tomorrow} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>{t("internshipModal.deadlineLabel")}</label>
                            <input
                                type="date" name="applicationDeadline" min={tomorrow}
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
                            <option value="to_be_discussed">{t("internshipModal.tbdOption")}</option>
                        </select>
                    </div>

                    {selection === 'amount' && (
                        <div style={{ marginTop: '1rem' }}>
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
                        <button type="button" onClick={onClose} className={s.cancelBtn}>
                            {t("internshipModal.cancelBtn")}
                        </button>
                        <button type="submit" className={s.submitBtn}>
                            {t("internshipModal.submitBtn")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}