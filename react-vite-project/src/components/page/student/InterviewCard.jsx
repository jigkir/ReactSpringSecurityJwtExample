import {useTranslation} from "react-i18next";
import {getInternshipCardClasses} from "../../../styles/AppStyles.jsx";
import Icon from "../../../styles/Icon.jsx";
import Button from "../../../styles/Button.jsx";
import AutoResizeTextarea from "../../../styles/AutoResizeTextarea.jsx";
import InterviewStatusPill from "../../interview/InterviewStatusPill.jsx";
import {
    getInterviewStatus,
    getInterviewTime,
    INTERVIEW_STATUS,
    INTERVIEW_STATUS_ACCENT
} from "../../../utils/interviewStatus.js";

const getMeetingUrl = (details) => {
    try {
        const url = new URL(details);
        return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
};

export default function InterviewCard({
                                          interview,
                                          dark,
                                          locale,
                                          hash,
                                          preview,
                                          busy,
                                          rejecting,
                                          rejectComment,
                                          onRejectCommentChange,
                                          onAccept,
                                          onStartReject,
                                          onDeny,
                                          onCloseForm
                                      }) {
    const {t} = useTranslation();
    const cardS = getInternshipCardClasses(dark);

    const time = getInterviewTime(interview);
    const status = getInterviewStatus(interview);
    const cancelled = status === INTERVIEW_STATUS.CANCELLED;
    const rejected = status === INTERVIEW_STATUS.REJECTED;
    const awaitingResponse = status === INTERVIEW_STATUS.AWAITING_RESPONSE;

    const formattedDate = time !== null
        ? new Intl.DateTimeFormat(locale, {dateStyle: "long", timeStyle: "short"}).format(new Date(time))
        : t("studentInterviews.invalidDate");

    const meetingUrl = interview.meetingType === "ONLINE" ? getMeetingUrl(interview.meetingDetails) : null;
    const highlighted = !preview && hash === `#interview-${interview.id}`;
    const muted = dark ? "text-white" : "text-slate-500";
    const sectionBorder = dark ? "border-slate-700" : "border-slate-200";
    const textareaClass = `w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    return (
        <article
            id={`interview-${interview.id}`}
            className={`${cardS.card} scroll-mt-20 border-l-4 ${INTERVIEW_STATUS_ACCENT[status]} ${dark ? "bg-slate-800" : "bg-white"} ${highlighted ? "ring-2 ring-indigo-500" : ""}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className={`${cardS.title} break-words`}>{interview.internshipTitle}</h2>
                    <p className={`mt-1 text-sm ${muted}`}>{interview.employerName}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <InterviewStatusPill dark={dark} status={status} label={t(`studentInterviews.statuses.${status}`)}/>
                </div>
            </div>

            <div className={`${cardS.detailsRow} mt-4 flex flex-wrap gap-2`}>
                <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                    <Icon name="event" size={20}/>
                    <span className="font-semibold">{t("studentInterviews.date")}:</span>
                    <span>{formattedDate}</span>
                </span>
                <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                    <span className="font-semibold">{t("studentInterviews.type")}:</span>
                    <span>{t(`studentInterviews.types.${interview.meetingType}`)}</span>
                </span>
                {interview.meetingType === "PHONE" &&
                    <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                        <span className="font-semibold">{t("studentInterviews.phoneNumber")}:</span>
                        <span>{interview.employerPhoneNumber}</span>
                    </span>
                }
            </div>

            <div className={`mt-4 space-y-3 border-t pt-4 ${sectionBorder}`}>
                <div>
                    <p className={`mb-1 text-sm font-semibold ${muted}`}>{t("studentInterviews.details")}</p>
                    {meetingUrl ? (
                        <a href={meetingUrl} target="_blank" rel="noopener noreferrer"
                           className={`break-all font-medium underline ${dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}>
                            {t("studentInterviews.openLink")}
                        </a>
                    ) : (
                        <p className="break-words">{interview.meetingDetails || t("studentInterviews.notProvided")}</p>
                    )}
                </div>

                <div className={`rounded-lg p-3 ${dark ? "bg-slate-900/30" : "bg-slate-50"}`}>
                    <p className={`mb-1 text-sm font-semibold ${muted}`}>{t("studentInterviews.message")}</p>
                    <p className="whitespace-pre-wrap break-words">{interview.message || t("studentInterviews.notProvided")}</p>
                </div>

                {/* --- Rejection Banner --- */}
                {cancelled && interview.cancellationReason && (
                    <p className={`text-sm font-semibold ${dark ? "text-red-300" : "text-red-700"}`} role="note">
                        {t(`studentInterviews.cancellationReasons.${interview.cancellationReason}`)}
                    </p>
                )}
                {rejected && interview.rejectionMessage && (
                    <div
                        className={`rounded-lg border-l-4 px-3 py-2 ${dark ? "border-red-500 bg-red-900/30" : "border-red-500 bg-red-50"}`}
                        role="note">
                        <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-red-300" : "text-red-700"}`}>
                            {t("studentInterviews.rejectionReason")}
                        </p>
                        <p className={`mt-0.5 text-sm font-semibold break-words whitespace-pre-wrap ${dark ? "text-red-100" : "text-red-900"}`}>
                            {interview.rejectionMessage}
                        </p>
                    </div>
                )}

                {/* --- Rejection reason (required) --- */}
                {rejecting && (
                    <div className="space-y-1 pt-2">
                        <label htmlFor={`rejectComment-${interview.id}`}
                               className={`block text-sm font-semibold ${muted}`}>
                            {t("studentInterviews.rejectionReasonLabel")}
                        </label>
                        <AutoResizeTextarea
                            id={`rejectComment-${interview.id}`}
                            value={rejectComment}
                            onChange={(e) => onRejectCommentChange(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder={t("studentInterviews.rejectPlaceholder")}
                            className={textareaClass}
                        />
                    </div>
                )}

                {/* --- Action Buttons: only while the student has not answered --- */}
                {awaitingResponse && (
                    <div className="flex justify-end gap-3 pt-2">
                        {rejecting ? (
                            <>
                                <Button dark={dark} tone="danger" icon="check"
                                        disabled={busy || !rejectComment.trim()}
                                        onClick={() => onDeny(interview.id)}>
                                    {t("studentInterviews.confirmRejection")}
                                </Button>
                                <Button dark={dark} tone="neutral" icon="close" disabled={busy} onClick={onCloseForm}>
                                    {t("studentInterviews.cancel")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button dark={dark} tone="success" icon="check" disabled={busy}
                                        onClick={() => onAccept(interview.id)}>
                                    {t("studentInterviews.accept")}
                                </Button>
                                <Button dark={dark} tone="danger" icon="close" disabled={busy}
                                        onClick={() => onStartReject(interview.id)}>
                                    {t("studentInterviews.reject")}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}