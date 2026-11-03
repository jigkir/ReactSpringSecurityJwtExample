import {getApplicationCardClasses} from "../../../styles/AppStyles.jsx";
import Button from "../../../styles/Button.jsx";
import Badge from "../../../styles/Badge.jsx";
import PdfPreview from "../../documents/PdfPreview.jsx";
import {useTranslation} from "react-i18next";
import {useCallback, useEffect, useState} from "react";
import InterviewPicker from "./interview/InterviewPicker.jsx";
import {
    createInterview,
    getEmployerInterviewsByApplicationId,
    updateInterview
} from "../../api/Api.jsx";



function ApplicationCard({application, dark, isNew, isPreviewOpen, onTogglePreview, getUrl, internshipTitle}) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewCVBtn");
    const [isCoverLetterPreviewOpen, setIsCoverLetterPreviewOpen] = useState(false);
    const coverViewLabel = isCoverLetterPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewCoverBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const [interview, setInterview] = useState(null);
    const interviewLabel =
        isInterviewSelectOpen ? t("employerInternship.closeInterviewPicker") : (interview == null ? t("employerInternship.openInterviewPicker") : t("employerInternship.editInterviewPicker")) ;

    const getInterviewFromApplication = useCallback(async (application) => {
        try {
            const interviews = await getEmployerInterviewsByApplicationId(application.id);
            setInterview(Array.isArray(interviews) ? (interviews.at(-1) ?? null) : null);
        } catch {
            setInterview(null);
        }
    }, []);


    useEffect(() => {
        void getInterviewFromApplication(application);
    }, [isInterviewSelectOpen]);

    const onToggleInterviewPicker = () => setIsInterviewSelectOpen(!isInterviewSelectOpen);
    const onToggleCoverLetterPreview = () => setIsCoverLetterPreviewOpen(!isCoverLetterPreviewOpen);

    const handleSendOffer = async (payload) => {
        try {
            if (interview !== null) {
                await updateInterview(interview.id, payload);
            } else {
                await createInterview(application.id, payload);
            }
            return {success: true};
        } catch (err) {
            return {success: false, message: err.i18n ?? {key: "postInternship.createGenericError"}};
        }
    };

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
                                {isNew && <Badge tone="new">{t("viewApplication.new")}</Badge>}
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
                            tone={isInterviewSelectOpen ? "danger" : (interview !== null ? "warning" : "accent")}
                            dark={dark}
                            icon={isInterviewSelectOpen ? "close" : (interview !== null ? "edit" : "send")}
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
                            className="mr-4"
                        >
                            {viewLabel}
                        </Button>
                        <Button
                            tone={isCoverLetterPreviewOpen ? "danger" : "accent"}
                            dark={dark}
                            icon={isCoverLetterPreviewOpen ? "close" : "visibility"}
                            onClick={onToggleCoverLetterPreview}
                            aria-expanded={isPreviewOpen}
                        >
                            {coverViewLabel}
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
                            interview={interview}
                        />
                    </div>
                )}

                {/* Inline Preview Container — forced underneath with a top border */}
                {isPreviewOpen && (
                    <div className="w-full pt-4 mt-4">
                        <PdfPreview
                            doc={{id: application.id, fileName: cvFileName}}
                            dark={dark}
                            getUrl={getUrl}
                        />
                    </div>
                )}

                {/* Inline Preview Container — forced underneath with a top border */}
                {isCoverLetterPreviewOpen && (
                    <div className="w-full pt-4 mt-4">
                        <PdfPreview
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