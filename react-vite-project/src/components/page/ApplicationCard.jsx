import { getApplicationCardClasses } from "../../styles/AppStyles.jsx";
import Button from "../../styles/Button.jsx";

function ApplicationCard({ student, cvFileName, dark, onView, isNew }) {
    const s = getApplicationCardClasses(dark);

    return (
        <div className={s.card}>
            {/* Left side: Student Info AND File Name grouped closer together */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className={s.title}>
                            {student?.firstName} {student?.lastName}
                        </h3>
                        {isNew && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white rounded-full animate-bounce">
                                New
                            </span>
                        )}
                    </div>
                    <p className={s.description}>
                        {student?.email}
                    </p>
                </div>

                <span className={s.fileName} title={cvFileName}>
                    {cvFileName || "No CV uploaded"}
                </span>
            </div>

            {/* Right side: View Button stays separate */}
            <div className="flex items-center">
                <Button
                    tone="accent"
                    dark={dark}
                    icon="visibility"
                    onClick={onView}
                >
                    View
                </Button>
            </div>
        </div>
    );
}

export default ApplicationCard;