import {getApplicationCardClasses} from "../../../styles/AppStyles.jsx";
import Button from "../../../styles/Button.jsx";
import CvPreview from "../cv/CvPreview.jsx";
import {useTranslation} from "react-i18next";
import {width} from "jsdom/lib/generated/css-property-descriptors.js";
import {useState} from "react";
import InterviewPicker from "./interview/InterviewPicker.jsx";

function ApplicationCard({application, dark, isNew, isPreviewOpen, onTogglePreview, getUrl, internshipTitle}) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const interviewLabel = isInterviewSelectOpen ? t("employerInternship.closeInterviewPicker") : t("employerInternship.openInterviewPicker");

    const onToggleInterviewPicker = () => setIsInterviewSelectOpen(!isInterviewSelectOpen);

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
                                    <span
                                        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white rounded-full animate-bounce">
                                        {t("viewApplication.new")}
                                    </span>
                                )}
                            </div>
                            <p className={s.description}>
                                {student?.email}
                            </p>
                            {internshipTitle && (
                                <p className={`${s.description} font-medium`}>{internshipTitle}</p>
                            )}
                        </div>

                        <span className={s.fileName} title={cvFileName}>
                            {cvFileName || "No CV uploaded"}
                        </span>
                    </div>

                    <div className="flex items-center">
                        <Button
                            tone={isInterviewSelectOpen ? "danger" : "accent"}
                            dark={dark}
                            icon={isInterviewSelectOpen ? "close" : "visibility"}
                            onClick={onToggleInterviewPicker}
                            aria-expanded={isInterviewSelectOpen}
                            className="mr-4"
                        >
                            {interviewLabel}
                        </Button>
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

                {/* Inline Interview Time Selector — forced underneath with a top border */}
                {isInterviewSelectOpen && (
                    <div className="w-full pt-4 mt-4">
                        <InterviewPicker
                            applicationId={application.student.id}
                            dark={dark}
                            onClose={() => setIsInterviewSelectOpen(false)}
                            onSendOffer={() => alert("Sending Offers not yet implemented")}
                        />
                    </div>
                )}

                {/* Inline Preview Container — forced underneath with a top border */}
                {isPreviewOpen && (
                    <div className="w-full pt-4 mt-4">
                        <CvPreview
                            doc={{id: application.id, fileName: cvFileName}}
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