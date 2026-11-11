import {useCallback, useEffect, useState} from "react";
import {useLocation, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getInternshipCardClasses, getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import Icon from "../../../styles/Icon.jsx";
import {acceptInterviews, denyInterviews, getStudentInterviews} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {MAX_PREVIEW_ITEMS} from "../../home/PreviewLoaders.js";
import PreviewState from "../../home/PreviewState.jsx";
import Button from "../../../styles/Button.jsx";
import AutoResizeTextarea from "../../../styles/AutoResizeTextarea.jsx"; // 👈 1. Added import here

const getInterviewTime = (interview) => {
    const raw = interview.scheduledAt ?? interview.interviewDate;
    if (!raw) return null;
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? null : time;
};

function isCancelled(interview) {
    return interview.interviewStatus === "CANCELLED";
}

function sortInterviews(interviews) {
    const now = Date.now();

    const getGroup = (interview) => {
        if (isCancelled(interview)) return 2;
        const time = getInterviewTime(interview);
        return time !== null && time >= now ? 0 : 1;
    };

    return [...interviews].sort((a, b) => {
        const groupA = getGroup(a);
        const groupB = getGroup(b);

        if (groupA !== groupB) return groupA - groupB;

        const timeA = getInterviewTime(a) ?? 0;
        const timeB = getInterviewTime(b) ?? 0;

        return groupA === 0 ? timeA - timeB : timeB - timeA;
    });
}

function getMeetingUrl(details) {
    try {
        const url = new URL(details);
        return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function Interviews({preview = false}) {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const cardS = getInternshipCardClasses(dark);

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const {hash} = useLocation();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    // Rejection state
    const [confirmId, setConfirmId] = useState(null);
    const [rejectComment, setRejectComment] = useState("");
    const [busyId, setBusyId] = useState(null);

    const loadInterviews = useCallback(async () => {
        try {
            const data = await getStudentInterviews();

            if (!Array.isArray(data)) {
                throw new Error("Invalid interviews response");
            }

            setInterviews(data);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadInterviews();
    }, [loadInterviews]);

    usePolling(loadInterviews);

    const closeForm = () => {
        setConfirmId(null);
        setRejectComment("");
    };

    const handleAccept = async (interviewId) => {
        setBusyId(interviewId);
        try {
            await acceptInterviews(interviewId);
            await loadInterviews();
        } catch {
            console.log("BAD!!!!!!!!!");
        } finally {
            setBusyId(null);
        }
    };

    const startReject = (interview) => {
        setConfirmId(interview.id);
        setRejectComment(interview.studentRejectionComment ?? "");
    };

    const handleDeny = async (interviewId) => {
        setBusyId(interviewId);
        try {
            await denyInterviews(interviewId, rejectComment.trim());
            closeForm();
            await loadInterviews();
        } catch {
            console.log("BAD!!!!!!!!!");
        } finally {
            setBusyId(null);
        }
    };

    const visibleInterviews = sortInterviews(interviews).filter((interview) => {
        const query = search.trim().toLowerCase();
        const time = getInterviewTime(interview);

        const status = isCancelled(interview)
            ? "cancelled"
            : time !== null && time < Date.now()
                ? "past"
                : "upcoming";

        const matchesSearch =
            (interview.internshipTitle ?? "").toLowerCase().includes(query) ||
            (interview.employerName ?? "").toLowerCase().includes(query);

        const matchesStatus =
            statusFilter === "ALL" || status === statusFilter;

        const matchesType =
            typeFilter === "ALL" || interview.meetingType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const shown = preview ? visibleInterviews.slice(0, MAX_PREVIEW_ITEMS) : visibleInterviews;

    useEffect(() => {
        if (preview || loading || !hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView?.({behavior: "smooth", block: "center"});
    }, [hash, loading, preview]);

    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
    const muted = dark ? "text-slate-400" : "text-slate-500";
    const sectionBorder = dark ? "border-slate-700" : "border-slate-200";

    const textareaClass = `w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    const renderCard = (interview) => {
        const time = getInterviewTime(interview);
        const validDate = time !== null;
        const cancelled = isCancelled(interview);
        const past = validDate && time < Date.now();
        const status = cancelled ? "cancelled" : past ? "past" : "upcoming";

        const formattedDate = validDate ? new Intl.DateTimeFormat(locale, {
            dateStyle: "long",
            timeStyle: "short"
        }).format(new Date(time)) : t("studentInterviews.invalidDate");

        const meetingUrl = interview.meetingType === "ONLINE" ? getMeetingUrl(interview.meetingDetails) : null;

        const statusIcon = cancelled ? "close" : past ? "check_circle" : "schedule";
        const accentBorder = cancelled ? "border-l-red-500" : past ? "border-l-slate-400" : "border-l-emerald-500";
        const statusClasses = cancelled
            ? (dark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700")
            : past
                ? (dark ? "border-slate-500/30 bg-slate-500/10 text-slate-200" : "border-slate-300 bg-slate-100 text-slate-700")
                : (dark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700");
        const highlighted = !preview && hash === `#interview-${interview.id}`;
        const awaitingResponse = !cancelled && !past && interview.studentDecision === "PENDING";

        const busy = busyId === interview.id;
        const isConfirmingReject = confirmId === interview.id;

        return (
            <article
                key={interview.id}
                id={`interview-${interview.id}`}
                className={`${cardS.card} scroll-mt-20 border-l-4 ${accentBorder} ${dark ? "bg-slate-800" : "bg-white"} ${highlighted ? "ring-2 ring-indigo-500" : ""}`}
            >

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className={`${cardS.title} break-words`}>
                            {interview.internshipTitle}
                        </h2>
                        <p className={`mt-1 text-sm ${muted}`}>
                            {interview.employerName}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {awaitingResponse && (
                            <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                                    dark ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                                        : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                <Icon name="hourglass_bottom" size={18}/>
                                <span>{t("studentInterviews.awaitingResponse")}</span>
                            </span>
                        )}
                        <span
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${statusClasses}`}>
                            <Icon name={statusIcon} size={18}/>
                            <span>{t(`studentInterviews.statuses.${status}`)}</span>
                        </span>
                    </div>
                </div>

                <div className={`${cardS.detailsRow} mt-4 flex flex-wrap gap-2`}>
                    <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                        <Icon name="event" size={20}/>
                        <span className="font-semibold">
                            {t("studentInterviews.date")}:
                        </span>
                        <span>{formattedDate}</span>
                    </span>

                    <span className={`${cardS.detailBadge} max-w-full flex-wrap gap-1.5`}>
                        <span className="font-semibold">
                            {t("studentInterviews.type")}:
                        </span>
                        <span>
                            {t(`studentInterviews.types.${interview.meetingType}`)}
                        </span>
                    </span>
                </div>

                <div className={`mt-4 space-y-3 border-t pt-4 ${sectionBorder}`}>
                    <div>
                        <p className={`mb-1 text-sm font-semibold ${muted}`}>
                            {t("studentInterviews.details")}
                        </p>

                        {meetingUrl ? (
                            <a
                                href={meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`break-all font-medium underline ${
                                    dark
                                        ? "text-blue-400 hover:text-blue-300"
                                        : "text-blue-600 hover:text-blue-700"
                                }`}
                            >
                                {t("studentInterviews.openLink")}
                            </a>
                        ) : (
                            <p className="break-words">
                                {interview.meetingDetails ||
                                    t("studentInterviews.notProvided")}
                            </p>
                        )}
                    </div>

                    <div className={`rounded-lg p-3 ${
                        dark ? "bg-slate-900/30" : "bg-slate-50"
                    }`}>
                        <p className={`mb-1 text-sm font-semibold ${muted}`}>
                            {t("studentInterviews.message")}
                        </p>

                        <p className="whitespace-pre-wrap break-words">
                            {interview.message ||
                                t("studentInterviews.notProvided")}
                        </p>
                    </div>

                    {/* Inline Rejection Reason Form */}
                    {isConfirmingReject && (
                        <div className="space-y-2 pt-2">
                            <label className={`block text-sm font-semibold ${muted}`}>
                                Rejection Reason:
                            </label>
                            <AutoResizeTextarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                rows={2}
                                autoFocus
                                placeholder="Specify the reason for rejecting..."
                                className={textareaClass}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        {isConfirmingReject ? (
                            <>
                                <Button
                                    dark={dark}
                                    tone="danger"
                                    icon="check"
                                    disabled={busy || !rejectComment.trim()}
                                    onClick={() => handleDeny(interview.id)}
                                >
                                    Confirm Rejection
                                </Button>
                                <Button
                                    dark={dark}
                                    tone="neutral"
                                    icon="close"
                                    disabled={busy}
                                    onClick={closeForm}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    dark={dark}
                                    tone="success"
                                    icon="check"
                                    disabled={busy}
                                    onClick={() => handleAccept(interview.id)}
                                >
                                    Accept
                                </Button>
                                <Button
                                    dark={dark}
                                    tone="warning"
                                    icon="edit"
                                    disabled={busy}
                                >
                                    Change date
                                </Button>
                                <Button
                                    dark={dark}
                                    tone="danger"
                                    icon="close"
                                    disabled={busy}
                                    onClick={() => startReject(interview)}
                                >
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </article>
        );
    };

    // Home preview: same states and spacing as every other Home preview
    if (preview) {
        return (
            <PreviewState dark={dark} error={error} loading={loading} empty={shown.length === 0}>
                {shown.map(renderCard)}
            </PreviewState>
        );
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>
                        {t("studentInterviews.title")}
                    </h1>
                </div>
            </div>

            <div className={s.listSection}>
                <div className={`${s.scrollArea} space-y-4`}>

                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">

                        <div>
                            <label htmlFor="interview-search" className="mb-1 block text-sm font-medium">
                                {t("studentInterviews.filters.search")}
                            </label>
                            <input
                                id="interview-search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("studentInterviews.filters.placeholder")}
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                    dark
                                        ? "bg-slate-800 border-slate-600 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                }`}
                            />
                        </div>

                        <div>
                            <label htmlFor="interview-status" className="mb-1 block text-sm font-medium">
                                {t("studentInterviews.filters.status")}
                            </label>
                            <select
                                id="interview-status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                    dark
                                        ? "bg-slate-800 border-slate-600 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                }`}
                            >
                                <option value="ALL">{t("studentInterviews.filters.all")}</option>
                                <option value="upcoming">{t("studentInterviews.statuses.upcoming")}</option>
                                <option value="past">{t("studentInterviews.statuses.past")}</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="interview-type" className="mb-1 block text-sm font-medium">
                                {t("studentInterviews.filters.type")}
                            </label>
                            <select
                                id="interview-type"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                    dark
                                        ? "bg-slate-800 border-slate-600 text-white"
                                        : "bg-white border-slate-300 text-slate-900"
                                }`}
                            >
                                <option value="ALL">{t("studentInterviews.filters.allTypes")}</option>
                                <option value="ONLINE">{t("studentInterviews.types.ONLINE")}</option>
                                <option value="IN_PERSON">{t("studentInterviews.types.IN_PERSON")}</option>
                                <option value="PHONE">{t("studentInterviews.types.PHONE")}</option>
                            </select>
                        </div>
                    </div>

                    {loading && (<p className={s.loadingText}>
                        {t("studentInterviews.loading")}
                    </p>)}

                    {!loading && error && (<p className={s.errorText} role="alert">
                        {t("studentInterviews.loadError")}
                    </p>)}

                    {!loading && !error && visibleInterviews.length === 0 && (
                        <p className={s.emptyText}>
                            {t(
                                interviews.length === 0
                                    ? "studentInterviews.empty"
                                    : "studentInterviews.filters.noResults"
                            )}
                        </p>
                    )}

                    {!loading && !error && shown.map(renderCard)}
                </div>
            </div>
        </div>
    );
}

export default Interviews;