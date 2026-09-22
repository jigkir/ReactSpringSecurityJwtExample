import { useState } from "react";
import { getInternshipModalClasses } from "../styles/appStyles.jsx";

export default function InternshipModal({ isOpen, onClose, onAddInternship, user }) {
    const s = getInternshipModalClasses();

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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const skillsArray = formData.requiredSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0);

        if (skillsArray.length === 0) {
            setError("Please enter at least one valid skill.");
            return;
        }

        const compensationRegex = /^\$\d+(\.\d+)?\/h$|^unpaid$|^non\s*rémunéré$/i;
        if (!compensationRegex.test(formData.compensation.trim())) {
            setError("Compensation must be in format like '$20/h' or 'unpaid'.");
            return;
        }

        const durationNumber = parseInt(formData.duration, 10);
        if (isNaN(durationNumber) || durationNumber <= 0) {
            setError("Duration must be a valid number of months.");
            return;
        }

        const newInternship = {
            ...formData,
            duration: `${durationNumber} mois`,
            status: "Pending Validation",
            submittedAt: new Date().toISOString(),
            isDeleted: false,
            employerId: user.id,
        };

        onClose();
        onAddInternship(newInternship);
    };

    return (
        <div className={s.overlay}>
            <div className={s.panel}>
                {/* Header */}
                <div className={s.header}>
                    <h2 className={s.title}>Post a New Internship</h2>
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
                        <label className={s.label}>Title :</label>
                        <input
                            type="text" name="title" value={formData.title}
                            onChange={handleChange} className={s.input} required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={s.label}>Description :</label>
                        <textarea
                            name="description" rows="3" value={formData.description}
                            onChange={handleChange} className={s.textarea} required
                        />
                    </div>

                    {/* Required skills */}
                    <div>
                        <label className={s.label}>Required skills :</label>
                        <input
                            type="text" name="requiredSkills" value={formData.requiredSkills}
                            onChange={handleChange} placeholder="ex: React, Node.js, Python"
                            className={s.input} required
                        />
                        <p className={s.hint}>Separate each skill with a comma.</p>
                    </div>

                    {/* Duration + Location */}
                    <div className={s.grid2}>
                        <div>
                            <label className={s.label}>Duration (months) :</label>
                            <input
                                type="number" name="duration" min="1" value={formData.duration}
                                onChange={handleChange} placeholder="ex: 3"
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>Location :</label>
                            <input
                                type="text" name="location" value={formData.location}
                                onChange={handleChange} placeholder="ex: Montréal (Hybride)"
                                className={s.input} required
                            />
                        </div>
                    </div>

                    {/* Start date + Deadline */}
                    <div className={s.grid2}>
                        <div>
                            <label className={s.label}>Start date :</label>
                            <input
                                type="date" name="startDate" value={formData.startDate}
                                min={minStartDay} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                        <div>
                            <label className={s.label}>Deadline to post :</label>
                            <input
                                type="date" name="deadline" min={today} max={maxDeadline}
                                value={formData.deadline} onChange={handleChange}
                                className={s.input} required
                            />
                        </div>
                    </div>

                    {/* Compensation */}
                    <div>
                        <label className={s.label}>Compensation :</label>
                        <input
                            type="text" name="compensation" value={formData.compensation}
                            onChange={handleChange} placeholder="ex: 20$/h or Unpaid"
                            className={s.input} required
                        />
                    </div>

                    {/* Footer */}
                    <div className={s.footer}>
                        <button type="button" onClick={onClose} className={s.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" className={s.submitBtn}>
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}