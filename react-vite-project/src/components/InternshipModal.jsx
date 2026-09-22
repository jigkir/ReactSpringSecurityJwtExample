import { useState } from "react";

export default function InternshipModal({ isOpen, onClose, onAddInternship }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requiredSkills: '',
        duration: '',
        location: '',
        startDate: '',
        deadline: '',
        compensation: ''
    });

    const [error, setError] = useState("")

    const today = new Date().toISOString().split("T")[0];
    const maxDeadline = formData.startDate
        ? (() => {
            const d = new Date(formData.startDate + 'T00:00:00');
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
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        setError("");

        const skillsArray = formData.requiredSkills
            .split(",")
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0);

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
            id: crypto.randomUUID(), //Temporary until backend is made
            ...formData,
            duration: `${durationNumber} mois`,
            status: "Pending Validation",
            submittedAt: new Date().toISOString(),
            isDeleted: false
        };
        // Handle form submission logic here
        console.log("Form submitted:", newInternship);
        onClose(); // Close modal after submitting
        onAddInternship(newInternship)
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">

                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Post a New Internship</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 font-bold text-2xl transition-colors"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600 text-sm font-medium animate-fadeIn">
                            <span>{error}</span>
                        </div>
                )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title :</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description :</label>
                        <textarea
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Required skills :</label>
                        <input
                            type="text"
                            name="requiredSkills"
                            value={formData.requiredSkills}
                            onChange={handleChange}
                            placeholder="ex: React, Node.js, Python"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Separate each skill with a comma.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (months) :</label>
                            <input
                                type="number"
                                name="duration"
                                min="1"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="ex: 3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Location :</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="ex: Montréal (Hybride)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Start date :</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                min={minStartDay}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Dead line to post :</label>
                            <input
                                type="date"
                                name="deadline"
                                min={today}
                                max={maxDeadline}
                                value={formData.deadline}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Compensation :</label>
                        <input
                            type="text"
                            name="compensation"
                            value={formData.compensation}
                            onChange={handleChange}
                            placeholder="ex: 20$/h or Unpaid"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-6 border-t mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"
                        >
                            Submit
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}