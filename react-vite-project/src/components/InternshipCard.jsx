export default function InternshipCard({ internship }) {
    const isPending = internship.status === "Pending Validation";
    const isApproved = internship.status === "Approved";
    const isDenied = internship.status === "Denied";

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left space-y-3">

            {/* Top row: Title and Status Badge with Icon and Text */}
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{internship.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{internship.description}</p>
                </div>

                {/* Status Badge with Dynamic Colors and Icons */}
                <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                        isPending
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : isApproved
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    {isPending ? (
                        /* Clock Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : isApproved ? (
                        /* Check Mark Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        /* Denied/X Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {internship.status}
                </span>
            </div>

            {/* Required Skills */}
            <div className="text-xs text-gray-700">
                <span className="font-semibold">Required Skills: </span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{internship.requiredSkills}</span>
            </div>

            {/* Details badges */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span className="bg-gray-100 px-2.5 py-1 rounded">📍 {internship.location}</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded">⏳ {internship.duration}</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded">💰 {internship.compensation}</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded">🚀 Start: {internship.startDate}</span>
                <span className="bg-gray-100 px-2.5 py-1 rounded">⏰ Deadline: {internship.deadline}</span>
            </div>
        </div>
    );
}