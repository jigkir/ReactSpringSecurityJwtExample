import {getApplicationCardClasses} from "../../../styles/AppStyles.jsx";
import Button from "../../../styles/Button.jsx";
import CvPreview from "../cv/CvPreview.jsx";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import InterviewPicker from "./interview/InterviewPicker.jsx";
import {createInterview} from "../../api/Api.jsx";

function ApplicationCard({application, dark, isNew, isPreviewOpen, onTogglePreview, getUrl, internshipTitle}) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const interviewLabel = isInterviewSelectOpen ? t("employerInternship.closeInterviewPicker") : t("employerInternship.openInterviewPicker");

    const onToggleInterviewPicker = () => setIsInterviewSelectOpen(!isInterviewSelectOpen);

    const handleSendOffer = async (payload) => {
        console.log("payload");
        try {
            if (editing) {
                const updated = await updateInterview(application.id, payload);
            } else {
                const saved = await createInterview(application.id, payload);
            }
            console.log("succ");
            return {success: true};
        } catch (err) {
            return {success: false, message: err.i18n ?? {key: "postInternship.createGenericError"}};
        }
    };

    return (
        <div className={`${s.card} min-w-0`}>
            {/* Wrapper ensures everything stacks vertically inside the card */}
            <div className="w-full min-w-0 flex flex-col">
                {/* Top row: Student Info on the left, View button on the right */}
                <div className="flex flex-wrap items-center justify-between w-full gap-x-6 gap-y-3">
                    <div className="min-w-0 flex flex-wrap items-center gap-x-8 gap-y-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`${s.title} break-words`}>
                                    {student?.firstName} {student?.lastName}
                                </h3>
                                {isNew && (
                                    <span
                                        className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white rounded-full animate-bounce">
                                        {t("viewApplication.new")}
                                    </span>
                                )}
                            </div>
                            <p className={`${s.description} break-all`}>
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

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            tone={isInterviewSelectOpen ? "danger" : "accent"}
                            dark={dark}
                            icon={isInterviewSelectOpen ? "close" : "event"}
                            onClick={onToggleInterviewPicker}
                            aria-expanded={isInterviewSelectOpen}
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
                            onSendOffer={handleSendOffer}
                            isEdit={editing}
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