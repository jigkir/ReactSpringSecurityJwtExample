import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {getApplicationCardClasses} from "../../../../styles/AppStyles.jsx";
import Button from "../../../../styles/Button.jsx";
import Badge from "../../../../styles/Badge.jsx";
import PdfPreview from "../../../documents/PdfPreview.jsx";
import InterviewPicker from "./interview/InterviewPicker.jsx";
import {
    createInterview,
    getApplicationCoverLetter,
    getApplicationTranscript,
    getEmployerInterviewsByApplicationId,
    updateInterview
} from "../../../api/Api.jsx";
import {blobUrlFromFile} from "../../../../utils/documents.js";
import {useToggleSet} from "../../../../utils/useToggleSet.js";

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
                             onInterviewSent,
                             selected = false,
                             onSelect,
                             selectionMode = false,
                             hiring = false,
                             showCvFileName = true
                         }) {
    const s = getApplicationCardClasses(dark);
    const {t} = useTranslation();
    const {student, cvFileName} = application;
    const isHired = application.employerDecision === "INTERNSHIP_OFFERED";
    const isRejected = application.employerDecision === "REJECTED";
    const canHire = !isHired && !isRejected;
    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewCVBtn");
    const [isInterviewSelectOpen, setIsInterviewSelectOpen] = useState(false);
    const [interview, setInterview] = useState(null);
    const [interviewLoading, setInterviewLoading] = useState(true);
    const [interviewError, setInterviewError] = useState(false);
    const openDocs = useToggleSet();
    const interviewLabel =
        isInterviewSelectOpen
            ? t("employerInternship.closeInterviewPicker")
            : (interview == null ? t("employerInternship.openInterviewPicker") : t("employerInternship.editInterviewPicker"));

    const hasCoverLetter = application.coverLetterId != null;
    const hasTranscript = application.transcriptId != null;
    const isCoverLetterOpen = openDocs.has(COVER_LETTER);
    const isTranscriptOpen = openDocs.has(TRANSCRIPT);

    useEffect(() => {
        let active = true;

        setInterviewLoading(true);
        setInterviewError(false);

        getEmployerInterviewsByApplicationId(application.id)
            .then((interviews) => {
                if (!active) return;

                if (!Array.isArray(interviews)) {
                    throw new Error("Invalid interviews response");
                }

                setInterview(interviews.at(-1) ?? null);
            })
            .catch(() => {
                if (active) setInterviewError(true);
            })
            .finally(() => {
                if (active) setInterviewLoading(false);
            });

        return () => {
            active = false;
        };
    }, [application.id, isInterviewSelectOpen]);

    const onToggleInterviewPicker = () => {
        if (!isInterviewSelectOpen) {
            setInterviewLoading(true);
            setInterviewError(false);
        }

        setIsInterviewSelectOpen((prev) => !prev);
    };

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
            <div className="flex w-full min-w-0 items-stretch gap-3 sm:gap-4">
                {selectionMode && typeof onSelect === "function" && (
                    <div className={`flex shrink-0 items-center justify-center border-r pr-3 sm:pr-4 ${
                        dark ? "border-slate-600" : "border-gray-300"
                    }`}>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => onSelect(application.id)}
                                disabled={!canHire || hiring}
                                aria-label={t("viewApplication.selectStudent", {
                                    name: `${student?.firstName} ${student?.lastName}`
                                })}
                                className="h-5 w-5 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                            />
                        </label>
                    </div>
                )}

                <div className="min-w-0 flex-1 flex flex-col">
                    {/* Top row: Student Info on the left, View button on the right */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className={s.title}>
                                        {student?.firstName} {student?.lastName}
                                    </h3>
                                    {isNew && <Badge tone="new">{t("viewApplication.new")}</Badge>}
                                    {isHired && (
                                        <Badge
                                            bounce={false}
                                            className="bg-green-600"
                                        >
                                            {t("viewApplication.hired")}
                                        </Badge>
                                    )}
                                </div>
                                <p className={`${s.description} min-w-0 break-all`}>
                                    {student?.email}
                                </p>
                                {internshipTitle && (
                                    <p className={`${s.description} font-medium`}>{internshipTitle}</p>
                                )}
                            </div>

                            {showCvFileName && (
                                <span className={s.fileName} title={cvFileName}>
                                {cvFileName || t("applicationCard.noCv")}
                            </span>
                            )}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto sm:ml-auto sm:min-w-52">
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
                            {/* Each preview button is blue while closed and red while its preview is open */}
                            {hasCoverLetter && (
                                <Button
                                    tone={isCoverLetterOpen ? "danger" : "accent"}
                                    lockTone
                                    dark={dark}
                                    className="w-full"
                                    icon={isCoverLetterOpen ? "close" : "visibility"}
                                    onClick={() => openDocs.toggle(COVER_LETTER)}
                                    aria-expanded={isCoverLetterOpen}
                                >
                                    {t("applicationCard.coverLetter")}
                                </Button>
                            )}
                            {hasTranscript && (
                                <Button
                                    tone={isTranscriptOpen ? "danger" : "accent"}
                                    lockTone
                                    dark={dark}
                                    className="w-full"
                                    icon={isTranscriptOpen ? "close" : "visibility"}
                                    onClick={() => openDocs.toggle(TRANSCRIPT)}
                                    aria-expanded={isTranscriptOpen}
                                >
                                    {t("applicationCard.transcript")}
                                </Button>
                            )}
                            <Button
                                tone={isPreviewOpen ? "danger" : "accent"}
                                lockTone
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
                            {interviewLoading ? (
                                <p>{t("interview.loading")}</p>
                            ) : interviewError ? (
                                <p role="alert" className="text-red-500">
                                    {t("interview.loadError")}
                                </p>
                            ) : (
                                <InterviewPicker
                                    application={application}
                                    dark={dark}
                                    onClose={() => setIsInterviewSelectOpen(false)}
                                    onSendOffer={handleSendOffer}
                                    interview={interview}
                                />
                            )}
                        </div>
                    )}

                    {/* Inline cover letter preview */}
                    {hasCoverLetter && isCoverLetterOpen && (
                        <div className="w-full pt-4 mt-4">
                            <PdfPreview
                                doc={{id: application.id, fileName: application.coverLetterFileName}}
                                dark={dark}
                                getUrl={getCoverLetterUrl}
                            />
                        </div>
                    )}

                    {/* Inline transcript preview */}
                    {hasTranscript && isTranscriptOpen && (
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
        </div>
    );
}

export default ApplicationCard;