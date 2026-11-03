import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {getApplicationCardClasses} from "../../../styles/AppStyles.jsx";
import Button from "../../../styles/Button.jsx";
import Badge from "../../../styles/Badge.jsx";
import PdfPreview from "../../documents/PdfPreview.jsx";
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


function ApplicationCard({
                             application,
                             dark,
                             isNew,
                             isPreviewOpen,
                             onTogglePreview,
                             getUrl,
                             internshipTitle,
                             onInterviewSent
                         }) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewCVBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const [interview, setInterview] = useState(null);
    const [openDoc, setOpenDoc] = useState(null); // null | COVER_LETTER | TRANSCRIPT
    const interviewLabel =
        isInterviewSelectOpen
            ? t("employerInternship.closeInterviewPicker")
            : (interview == null ? t("employerInternship.openInterviewPicker") : t("employerInternship.editInterviewPicker"));

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
                await updateInterview(interview.id, payload);
            } else {
                await createInterview(application.id, payload);
            }
            onInterviewSent?.(application.id);
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
                            <p className={`${s.description} min-w-0 break-all`}>
                                {student?.email}
                            </p>
                            {internshipTitle && (
                                <p className={`${s.description} font-medium`}>{internshipTitle}</p>
                            )}
                        </div>

                        <span className={s.fileName} title={cvFileName}>
                            {cvFileName || t("applicationCard.noCv")}
                        </span>
                    </div>

                    <div className="flex flex-col items-stretch gap-2 sm:min-w-52">
                        <Button
                            tone={isInterviewSelectOpen ? "danger" : (interview !== null ? "warning" : "accent")}
                            dark={dark}
                            className="w-full"
                            icon={isInterviewSelectOpen ? "close" : (interview !== null ? "edit" : "send")}
                            onClick={onToggleInterviewPicker}
                            aria-expanded={isInterviewSelectOpen}
                        >
                            {interviewLabel}
                        </Button>
                        {hasCoverLetter && (
                            <Button
                                tone={openDoc === COVER_LETTER ? "danger" : "accent"}
                                dark={dark}
                                className="w-full"
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
                                className="w-full"
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
                            className="w-full"
                            icon={isPreviewOpen ? "close" : "visibility"}
                            onClick={onTogglePreview}
                            aria-expanded={isPreviewOpen}
                        >
                            {viewLabel}
                        </Button>
                    </div>
                </div>

                {/* Inline Interview Time Selector */}
                {isInterviewSelectOpen && (
                    <div className="w-full pt-4 mt-4">
                        <InterviewPicker
                            application={application}
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

                {/* Inline CV preview */}
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