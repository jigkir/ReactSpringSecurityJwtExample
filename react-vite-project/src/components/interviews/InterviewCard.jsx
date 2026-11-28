import {useState} from "react";
import {useTranslation} from "react-i18next";
import {getInternshipCardClasses} from "../../styles/AppStyles.jsx";
import Icon from "../../styles/Icon.jsx";
import Button from "../../styles/Button.jsx";
import AutoResizeTextarea from "../../styles/AutoResizeTextarea.jsx";
import InterviewStatusPill from "./InterviewStatusPill.jsx";
import InterviewActions from "./InterviewActions.jsx";
import InterviewPicker from "./InterviewPicker.jsx";
import {useNotifications} from "../notification/NotificationsProvider.jsx";
import {ALL, borderStatusOf} from "../../utils/StatusColor.js";
import {
    getInterviewStatus,
    getInterviewTime,
    INTERVIEW_STATUS,
    INTERVIEW_STATUS_ACCENT
} from "../../utils/interviewStatus.js";

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
                                          filterColor = ALL,
                                          busy,
                                          rejecting,
                                          rejectComment,
                                          onRejectCommentChange,
                                          onAccept,
                                          onStartReject,
                                          onDeny,
                                          onCloseForm
                                          , role, reload
                                      }) {
    const {t} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const [localRejecting, setLocalRejecting] = useState(false);
    const [rejectCommentLocal, setRejectCommentLocal] = useState("");
    const [busyLocal, setBusyLocal] = useState(false);
    const [editingLocal, setEditingLocal] = useState(false);
    const [actionError, setActionError] = useState(null);
    const effectiveRejecting = rejecting ?? localRejecting;
    const effectiveRejectComment = rejectComment ?? rejectCommentLocal;
    const effectiveBusy = busy ?? busyLocal;
    // While a status color is selected, the card gets a full border of that color
    const filtered = filterColor !== ALL;
    const cardS = getInternshipCardClasses(dark, borderStatusOf(filterColor));

    const time = getInterviewTime(interview);
    const status = getInterviewStatus(interview);
    const cancelled = status === INTERVIEW_STATUS.CANCELLED;
    const rejected = status === INTERVIEW_STATUS.REJECTED;
    const awaitingResponse = status === INTERVIEW_STATUS.AWAITING_RESPONSE;

    const formattedDate = time !== null
        ? new Intl.DateTimeFormat(locale, {dateStyle: "long", timeStyle: "short"}).format(new Date(time))
        : t("studentInterviews.invalidDate");

    const meetingUrl = interview.meetingType === "ONLINE" ? getMeetingUrl(interview.meetingDetails) : null;
    const highlighted = hash === `#interview-${interview.id}`;
    const muted = dark ? "text-white" : "text-slate-500";
    const sectionBorder = dark ? "border-slate-700" : "border-slate-200";
    const accent = filtered ? "" : `border-l-4 ${INTERVIEW_STATUS_ACCENT[status]}`;
    const textareaClass = `w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    return (
        <article
            id={`interview-${interview.id}`}
            className={`${cardS.card} scroll-mt-20 ${accent} ${dark ? "bg-slate-800" : "bg-white"} ${highlighted ? "ring-2 ring-indigo-500" : ""}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className={`${cardS.title} wrap-break-word`}>{interview.internshipTitle}</h2>
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
                        <span>{interview.employerPhoneNumber ?? interview.interviewPhoneNumber}</span>
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
                        <p className="wrap-break-word">{interview.meetingDetails || t("studentInterviews.notProvided")}</p>
                    )}
                </div>

                <div className={`rounded-lg p-3 ${dark ? "bg-slate-900/30" : "bg-slate-50"}`}>
                    <p className={`mb-1 text-sm font-semibold ${muted}`}>{t("studentInterviews.message")}</p>
                    <p className="whitespace-pre-wrap wrap-break-word">{interview.message || t("studentInterviews.notProvided")}</p>
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
                        <p className={`mt-0.5 text-sm font-semibold wrap-break-word whitespace-pre-wrap ${dark ? "text-red-100" : "text-red-900"}`}>
                            {interview.rejectionMessage}
                        </p>
                    </div>
                )}

                {/* --- Rejection reason (required) --- */}
                {effectiveRejecting && (
                    <div className="space-y-1 pt-2">
                        <label htmlFor={`rejectComment-${interview.id}`}
                               className={`block text-sm font-semibold ${muted}`}>
                            {t("studentInterviews.rejectionReasonLabel")}
                        </label>
                        <AutoResizeTextarea
                            id={`rejectComment-${interview.id}`}
                            value={effectiveRejectComment}
                            onChange={(e) => onRejectCommentChange ? onRejectCommentChange(e.target.value) : setRejectCommentLocal(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder={t("studentInterviews.rejectPlaceholder")}
                            className={textareaClass}
                        />
                    </div>
                )}

                {actionError && <p className="text-sm text-red-500" role="alert">{t(actionError.key, actionError.options)}</p>}
                <InterviewActions
                    dark={dark} role={role} isStudentAwaiting={awaitingResponse}
                    isEmployerEditable={role?.can.edit && status !== INTERVIEW_STATUS.CANCELLED && status !== INTERVIEW_STATUS.PAST}
                    busy={effectiveBusy} rejecting={effectiveRejecting}
                    onAccept={async () => {
                        if (onAccept) return onAccept(interview.id);
                        setBusyLocal(true); setActionError(null);
                        try { await role.accept(interview.id); await reload(); await refreshNotifications(); }
                        catch (err) { setActionError(err.i18n ?? {key: "postInternship.createGenericError"}); }
                        finally { setBusyLocal(false); }
                    }}
                    onStartReject={() => onStartReject ? onStartReject(interview.id) : setLocalRejecting(true)}
                    onDeny={async () => {
                        if (onDeny) return onDeny(interview.id);
                        if (!effectiveRejectComment.trim()) return;
                        setBusyLocal(true); setActionError(null);
                        try { await role.reject(interview.id, effectiveRejectComment.trim()); setLocalRejecting(false); await reload(); await refreshNotifications(); }
                        catch (err) { setActionError(err.i18n ?? {key: "postInternship.createGenericError"}); }
                        finally { setBusyLocal(false); }
                    }}
                    onCloseForm={() => onCloseForm ? onCloseForm() : setLocalRejecting(false)}
                    onEdit={() => setEditingLocal((value) => !value)}
                    onCancel={async () => {
                        if (!window.confirm(t("employerInterviews.confirmCancel"))) return;
                        setBusyLocal(true); setActionError(null);
                        try { await role.cancel(interview.id); await reload(); await refreshNotifications(); }
                        catch (err) { setActionError(err.i18n ?? {key: "postInternship.createGenericError"}); }
                        finally { setBusyLocal(false); }
                    }}
                    editing={editingLocal}
                />
                {role?.can.edit && editingLocal && (
                    <div className="w-full pt-4 mt-4">
                        <InterviewPicker key={interview.id} dark={dark} interview={interview}
                                         onClose={() => setEditingLocal(false)}
                                         onSendOffer={async (payload) => {
                                             try { await role.update(interview.id, payload); await reload(); await refreshNotifications(); return {success: true}; }
                                             catch (err) { return {success: false, message: err.i18n ?? {key: "postInternship.createGenericError"}}; }
                                         }}/>
                    </div>
                )}
            </div>
        </article>
    );
}