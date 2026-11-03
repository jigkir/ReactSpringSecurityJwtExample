import {getApplicationCardClasses} from "../../../styles/AppStyles.jsx";
import Button from "../../../styles/Button.jsx";
import Badge from "../../../styles/Badge.jsx";
import PdfPreview from "../../documents/PdfPreview.jsx";
import {useTranslation} from "react-i18next";
import {useCallback, useEffect, useState} from "react";
import InterviewPicker from "./interview/InterviewPicker.jsx";
import {
    createInterview,
    getApplicationCoverLetter,
    getApplicationTranscript,
    getEmployerInterviewsByApplicationId,
    updateInterview
} from "../../api/Api.jsx";
import {blobUrlFromFile} from "../../../utils/documents.js";

const COVER_LETTER = "COVER_LETTER";
const TRANSCRIPT = "TRANSCRIPT";

const getCoverLetterUrl = async (applicationId) => blobUrlFromFile(await getApplicationCoverLetter(applicationId));
const getTranscriptUrl = async (applicationId) => blobUrlFromFile(await getApplicationTranscript(applicationId));


function ApplicationCard({application, dark, isNew, isPreviewOpen, onTogglePreview, getUrl, internshipTitle}) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const [interview, setInterview] = useState(null);
    const [openDoc, setOpenDoc] = useState(null); // null | COVER_LETTER | TRANSCRIPT
    const interviewLabel =
        isInterviewSelectOpen ? t("employerInternship.closeInterviewPicker") : (interview == null ? t("employerInternship.openInterviewPicker") : t("employerInternship.editInterviewPicker")) ;

    const hasCoverLetter = application.coverLetterId != null;
    const hasTranscript = application.transcriptId != null;

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

    const toggleDoc = (doc) => setOpenDoc((current) => (current === doc ? null : doc));

    const handleSendOffer = async (payload) => {
        try {
            if (interview !== null) {
                const updated = await updateInterview(interview.id, payload);
            } else {
                const saved = await createInterview(application.id, payload);
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

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            tone={isInterviewSelectOpen ? "danger" : "accent"}
                            dark={dark}
                            icon={isInterviewSelectOpen ? "close" : "visibility"}
                            onClick={onToggleInterviewPicker}
                            aria-expanded={isInterviewSelectOpen}
                        >
                            {interviewLabel}
                        </Button>
                        {hasCoverLetter && (
                            <Button
                                tone={openDoc === COVER_LETTER ? "danger" : "accent"}
                                dark={dark}
                                icon={openDoc === COVER_LETTER ? "close" : "visibility"}
                                onClick={() => toggleDoc(COVER_LETTER)}
                                aria-expanded={openDoc === COVER_LETTER}
                            >
                                {t("applicationCard.coverLetter")}
                            </Button>
                        )}
                        {hasTranscript && (
                            <Button
                                tone={openDoc === TRANSCRIPT ? "danger" : "accent"}
                                dark={dark}
                                icon={openDoc === TRANSCRIPT ? "close" : "visibility"}
                                onClick={() => toggleDoc(TRANSCRIPT)}
                                aria-expanded={openDoc === TRANSCRIPT}
                            >
                                {t("applicationCard.transcript")}
                            </Button>
                        )}
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
                            interview={interview}
                        />
                    </div>
                )}

                {/* Inline cover letter preview */}
                {hasCoverLetter && openDoc === COVER_LETTER && (
                    <div className="w-full pt-4 mt-4">
                        <PdfPreview
                            doc={{id: application.id, fileName: application.coverLetterFileName}}
                            dark={dark}
                            getUrl={getCoverLetterUrl}
                        />
                    </div>
                )}

                {/* Inline transcript preview */}
                {hasTranscript && openDoc === TRANSCRIPT && (
                    <div className="w-full pt-4 mt-4">
                        <PdfPreview
                            doc={{id: application.id, fileName: application.transcriptFileName}}
                            dark={dark}
                            getUrl={getTranscriptUrl}
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
            </div>
        </div>
    );
}

export default ApplicationCard;