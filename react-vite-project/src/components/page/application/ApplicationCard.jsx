import {getApplicationCardClasses} from "../../../styles/AppStyles.jsx";
import Button from "../../../styles/Button.jsx";
import CvPreview from "../cv/CvPreview.jsx";
import {useTranslation} from "react-i18next";
import {useCallback, useState} from "react";
import InterviewPicker from "./interview/InterviewPicker.jsx";
import {createInterview, getApplicationCoverLetter, updateInterview} from "../../api/Api.jsx";
import {base64ToBlobUrl} from "../cv/cvUtils.js";

function ApplicationCard({application, dark, isNew, isPreviewOpen, onTogglePreview, getUrl, internshipTitle}) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [isLetterOpen, setIsLetterOpen] = useState(false);
    const interviewLabel = isInterviewSelectOpen ? t("employerInternship.closeInterviewPicker") : t("employerInternship.openInterviewPicker");

    const hasLetter = Boolean(application.coverLetterFileName);

    const onToggleInterviewPicker = () => setIsInterviewSelectOpen(!isInterviewSelectOpen);

    const getLetterUrl = useCallback(async (appId) => {
        const letter = await getApplicationCoverLetter(appId);
        if (!letter?.content) throw new Error("missing content");
        return base64ToBlobUrl(letter.content);
    }, []);

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
                {/* Top row: Student Info on the left, View buttons on the right */}
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
                        {hasLetter && (
                            <span className={s.fileName} title={application.coverLetterFileName}>
                                {application.coverLetterFileName}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            tone="accent"
                            lockTone
                            dark={dark}
                            icon={isInterviewSelectOpen ? "close" : "event"}
                            onClick={onToggleInterviewPicker}
                            aria-expanded={isInterviewSelectOpen}
                        >
                            {interviewLabel}
                        </Button>
                        <Button
                            tone="accent"
                            lockTone
                            dark={dark}
                            icon={isPreviewOpen ? "close" : "visibility"}
                            onClick={onTogglePreview}
                            aria-expanded={isPreviewOpen}
                        >
                            {viewLabel}
                        </Button>
                        {hasLetter && (
                            <Button
                                tone="accent"
                                lockTone
                                dark={dark}
                                icon={isLetterOpen ? "close" : "visibility"}
                                onClick={() => setIsLetterOpen((o) => !o)}
                                aria-expanded={isLetterOpen}
                            >
                                {isLetterOpen ? t("cvPreview.closeBtn") : t("applicationCard.coverLetter")}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Inline Interview Time Selector */}
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

                {/* Inline CV preview */}
                {isPreviewOpen && (
                    <div className="w-full pt-4 mt-4">
                        <CvPreview
                            doc={{id: application.id, fileName: cvFileName}}
                            dark={dark}
                            getUrl={getUrl}
                        />
                    </div>
                )}

                {/* Inline cover letter preview */}
                {isLetterOpen && (
                    <div className="w-full pt-4 mt-4">
                        <CvPreview
                            doc={{id: application.id, fileName: application.coverLetterFileName}}
                            dark={dark}
                            getUrl={getLetterUrl}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ApplicationCard;