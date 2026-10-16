import { getApplicationCardClasses } from "../../styles/AppStyles.jsx";
import Button from "../../styles/Button.jsx";
import CvPreview from "./cv/CvPreview.jsx";

function ApplicationCard({ application, dark, isNew, isPreviewOpen, onTogglePreview, getUrl }) {
    const s = getApplicationCardClasses(dark);
    const { student, cvFileName } = application;
    const viewLabel = isPreviewOpen ? "Close" : "View";

    return (
        <div className={s.card}>
            {/* Wrapper ensures everything stacks vertically inside the card */}
            <div className="w-full flex flex-col">
                {/* Top row: Student Info on the left, View button on the right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
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

                    <div className="flex items-center">
                        <Button
                            tone={isPreviewOpen ? "danger" : "accent"}
                            dark={dark}
                            icon={isPreviewOpen ? "close" : "visibility"}
                            onClick={onTogglePreview}
                            aria-expanded={isPreviewOpen}
                        >
                            {viewLabel}
                        </Button>
                    </div>
                </div>

                {/* Inline Preview Container — forced underneath with a top border */}
                {isPreviewOpen && (
                    <div className="w-full pt-4 mt-4">
                        <CvPreview
                            doc={{ id: application.id, fileName: cvFileName }}
                            dark={dark}
                            getUrl={getUrl}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ApplicationCard;