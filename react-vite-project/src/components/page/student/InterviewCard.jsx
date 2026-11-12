import { useTranslation } from "react-i18next";
import { getInternshipCardClasses } from "../../../styles/AppStyles.jsx";
import Icon from "../../../styles/Icon.jsx";
import Button from "../../../styles/Button.jsx";
import AutoResizeTextarea from "../../../styles/AutoResizeTextarea.jsx";
import { Field } from "../../../utils/CommonFields.jsx";

const getInterviewTime = (interview) => {
    const raw = interview.scheduledAt ?? interview.interviewDate;
    if (!raw) return null;
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? null : time;
};

const isCancelled = (interview) => interview.interviewStatus === "CANCELLED";

const getInterviewStatus = (interview) => {
    if (isCancelled(interview)) return "cancelled";

    const time = getInterviewTime(interview);
    if (time !== null && time < Date.now()) return "past";

    if (interview.studentDecision === "REJECTED") return "rejected";
    if (interview.studentDecision === "ACCEPTED") return "accepted";
    if (interview.studentDecision === "RESCHEDULE_REQUESTED") return "rescheduled";

    return "upcoming";
};

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
                                          activeMode,
                                          rejectComment,
                                          nouvelDate,
                                          onRejectCommentChange,
                                          onNouvelDateChange,
                                          onAccept,
                                          onStartReject,
                                          onStartReschedule,
                                          onDeny,
                                          onReschedule,
                                          onCloseForm
                                      }) {
    const { t } = useTranslation();
    const cardS = getInternshipCardClasses(dark);

    const time = getInterviewTime(interview);
    const validDate = time !== null;
    const cancelled = isCancelled(interview);
    const past = validDate && time < Date.now();
    const status = getInterviewStatus(interview);

    const rejected = status === "rejected";
    const accepted = status === "accepted";
    const rescheduled = status === "rescheduled";

    const formattedDate = validDate
        ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(time))
        : t("studentInterviews.invalidDate");

    const meetingUrl = interview.meetingType === "ONLINE" ? getMeetingUrl(interview.meetingDetails) : null;
    const statusIcon = cancelled || rejected ? "close" : past || accepted ? "check_circle" : "schedule";
    const accentBorder = cancelled || rejected
        ? "border-l-red-500"
        : past
            ? "border-l-slate-400"
            : rescheduled
                ? "border-l-amber-500"
                : "border-l-emerald-500";

    const statusClasses = cancelled || rejected
        ? (dark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700")
        : past
            ? (dark ? "border-slate-500/30 bg-slate-500/10 text-slate-200" : "border-slate-300 bg-slate-100 text-slate-700")
            : rescheduled
                ? (dark ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-700")
                : (dark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700");

    const highlighted = !preview && hash === `#interview-${interview.id}`;
    const awaitingResponse = (!cancelled && !past && interview.studentDecision === "PENDING") || rescheduled;
    const muted = dark ? "text-white" : "text-slate-500";
    const sectionBorder = dark ? "border-slate-700" : "border-slate-200";

    const textareaClass = `w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
        dark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"
    }`;

    const isConfirming = activeMode !== null;
    const isRejecting = activeMode === "REJECT";
    const isRescheduling = activeMode === "RESCHEDULE";
    const minDateTime = new Date().toISOString().slice(0, 16);

    return (
        <article
            id={`interview-${interview.id}`}
            className={`${cardS.card} scroll-mt-20 border-l-4 ${accentBorder} ${dark ? "bg-slate-800" : "bg-white"} ${highlighted ? "ring-2 ring-indigo-500" : ""}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className={`${cardS.title} break-words`}>{interview.internshipTitle}</h2>
                    <p className={`mt-1 text-sm ${muted}`}>{interview.employerName}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {awaitingResponse && (
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                            dark ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}>
                            <Icon name="hourglass_bottom" size={18} />
                            <span>{t("studentInterviews.awaitingResponse")}</span>
                        </span>
                    )}
                    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${statusClasses}`}>
                        <Icon name={statusIcon} size={18} />
                        <span>{t(`studentInterviews.statuses.${status}`)}</span>
                    </span>
                </div>
            </div>

            <div className={`${cardS.detailsRow} mt-4 flex flex-wrap gap-2`}>
                <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                    <Icon name="event" size={20} />
                    <span className="font-semibold">{t("studentInterviews.date")}:</span>
                    <span>{formattedDate}</span>
                </span>
                <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                    <span className="font-semibold">{t("studentInterviews.type")}:</span>
                    <span>{t(`studentInterviews.types.${interview.meetingType}`)}</span>
                </span>
            </div>

            <div className={`mt-4 space-y-3 border-t pt-4 ${sectionBorder}`}>
                <div>
                    <p className={`mb-1 text-sm font-semibold ${muted}`}>{t("studentInterviews.details")}</p>
                    {meetingUrl ? (
                        <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className={`break-all font-medium underline ${dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}>
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
                {rejected && interview.rejectionMessage && (
                    <div className={`rounded-lg border-l-4 px-3 py-2 ${dark ? "border-red-500 bg-red-900/30" : "border-red-500 bg-red-50"}`} role="note">
                        <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-red-300" : "text-red-700"}`}>
                            {t("studentInterviews.rejectionReason")}
                        </p>
                        <p className={`mt-0.5 text-sm font-semibold break-words whitespace-pre-wrap ${dark ? "text-red-100" : "text-red-900"}`}>
                            {interview.rejectionMessage}
                        </p>
                    </div>
                )}

                {/* --- Action Input Form --- */}
                {isConfirming && (
                    <div className="space-y-3 pt-2">
                        {isRescheduling && (
                            <Field id={`changeDate-${interview.id}`} label={t("studentInterviews.chooseNewDate")}>
                                <input
                                    id={`changeDate-${interview.id}`}
                                    type="datetime-local"
                                    name="changeDate"
                                    min={minDateTime}
                                    value={nouvelDate}
                                    onChange={(e) => onNouvelDateChange(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                        )}

                        <div className="space-y-1">
                            <label className={`block text-sm font-semibold ${muted}`}>
                                {isRescheduling ? t("studentInterviews.reasonMessage") : t("studentInterviews.rejectionReasonLabel")}
                            </label>
                            <AutoResizeTextarea
                                value={rejectComment}
                                onChange={(e) => onRejectCommentChange(e.target.value)}
                                rows={2}
                                autoFocus
                                placeholder={isRescheduling ? t("studentInterviews.reschedulePlaceholder") : t("studentInterviews.rejectPlaceholder")}
                                className={textareaClass}
                            />
                        </div>
                    </div>
                )}

                {/* --- Action Buttons --- */}
                {!cancelled && !past && (
                    <div className="flex justify-end gap-3 pt-2">
                        {isConfirming ? (
                            <>
                                <Button
                                    dark={dark}
                                    tone={isRejecting ? "danger" : "warning"}
                                    icon="check"
                                    disabled={busy || !rejectComment.trim() || (isRescheduling && !nouvelDate)}
                                    onClick={() => (isRejecting ? onDeny(interview.id) : onReschedule(interview.id))}
                                >
                                    {isRejecting ? (rejected ? t("studentInterviews.confirmNewMessage") : t("studentInterviews.confirmRejection")) : t("studentInterviews.confirmReschedule")}
                                </Button>
                                <Button dark={dark} tone="neutral" icon="close" disabled={busy} onClick={onCloseForm}>
                                    {t("studentInterviews.cancel")}
                                </Button>
                            </>
                        ) : (
                            <>
                                {!accepted && (
                                    <Button dark={dark} tone="success" icon="check" disabled={busy}
                                            onClick={() => onAccept(interview.id)}>
                                        {t("studentInterviews.accept")}
                                    </Button>
                                )}
                                <Button
                                    dark={dark}
                                    tone="warning"
                                    lockTone
                                    icon="edit"
                                    disabled={busy}
                                    onClick={() => onStartReschedule(interview)}
                                >
                                    {rescheduled ? t("studentInterviews.editReschedule") : t("studentInterviews.changeDate")}
                                </Button>
                                <Button
                                    dark={dark}
                                    tone={rejected ? "warning" : "danger"}
                                    lockTone
                                    icon={rejected ? "edit" : "close"}
                                    disabled={busy}
                                    onClick={() => onStartReject(interview)}
                                >
                                    {rejected ? t("studentInterviews.editMessage") : t("studentInterviews.reject")}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}