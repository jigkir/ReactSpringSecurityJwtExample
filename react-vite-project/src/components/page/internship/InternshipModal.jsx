import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getInternshipModalClasses} from '../../../styles/appStyles.jsx';

export default function InternshipModal({isOpen, onClose, onAddInternship, user, dark}) {
    const {t} = useTranslation();
    const s = getInternshipModalClasses(dark);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        requiredSkills: "",
        duration: "",
        location: "",
        startDate: "",
        deadline: "",
        compensation: "",
    });

    const [error, setError] = useState("");

    const today = new Date().toISOString().split("T")[0];

    const maxDeadline = formData.startDate
        ? (() => {
            const d = new Date(formData.startDate + "T00:00:00");
            // Check if the date is valid before doing math
            if (isNaN(d.getTime())) return "";
            d.setDate(d.getDate() - 14);
            return d.toISOString().split("T")[0];
        })()
        : "";

    const minStartDay = today
        ? (() => {
            const d = new Date(today + 'T00:00:00');
            if (isNaN(d.getTime())) return "";
            d.setDate(d.getDate() + 14);
            return d.toISOString().split("T")[0]
        })() : "";

    if (!isOpen) return null;

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.title.trim().length < 2 || formData.title.trim().length > 50) {
            setError(t("internshipModal.titleTooShort"));
            return;
        }

        const skillsArray = formData.requiredSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0);

        if (skillsArray.length === 0) {
            setError(t("internshipModal.errorSkills"));
            return;
        }

        const compensationRegex = /^(?:(?:\$\d+|\d+\$)\/h|non rémunéré|unpaid)$/i;
        if (!compensationRegex.test(formData.compensation.trim())) {
            setError(t("internshipModal.errorCompensation"));
            return;
        }

        const durationNumber = parseInt(formData.duration, 10);
        if (isNaN(durationNumber) || durationNumber <= 0) {
            setError(t("internshipModal.errorDuration"));
            return;
        }

        const newInternship = {
            ...formData,
            duration: t("internshipModal.duration", {count: durationNumber}),
            status: "PENDING",
            submittedAt: new Date().toISOString(),
            isDeleted: false,
            employerId: user.id,
        };

        const result = await onAddInternship(newInternship);
        if (!result?.success) {
            setError(result?.message || t("postInternship.createError"));
            return;
        }
        onClose();
    };

    return (
        <div className={s.overlay}>
            <div className={s.panel}>
                {/* Header */}
                <div className={s.header}>
                    <h2 className={s.title}>{t("internshipModal.title")}</h2>
                    <button type="button" onClick={onClose} className={s.closeBtn}>
                        &times;
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
                                type="number" name="duration" min="1" value={formData.duration}
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
                                min={minStartDay} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>{t("internshipModal.deadlineLabel")}</label>
                            <input
                                type="date" name="deadline" min={today} max={maxDeadline}
                                value={formData.deadline} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                    </div>

                    {/* Compensation */}
                    <div>
                        <label className={s.label}>{t("internshipModal.compensationLabel")}</label>
                        <input
                            type="text" name="compensation" value={formData.compensation}
                            onChange={handleChange} placeholder={t("internshipModal.compensationPlaceholder")}
                            className={s.input} required
                        />
                    </div>

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