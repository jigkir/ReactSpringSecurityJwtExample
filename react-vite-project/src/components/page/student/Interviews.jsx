import { useCallback, useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPostInternshipClasses } from "../../../styles/AppStyles.jsx";
import { acceptInterviews, denyInterviews, getStudentInterviews, rescheduleInterviews } from "../../api/Api.jsx";
import { usePolling } from "../../../utils/usePolling.js";
import PreviewState from "../../home/PreviewState.jsx";
import InterviewCard from "./InterviewCard.jsx";

const getInterviewTime = (interview) => {
    const raw = interview.scheduledAt ?? interview.interviewDate;
    if (!raw) return null;
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? null : time;
};

const isCancelled = (interview) => interview.interviewStatus === "CANCELLED";

const getInterviewStatus = (interview) => {
    if (isCancelled(interview)) return "cancelled";
    if (interview.studentDecision === "REJECTED") return "rejected";
    if (interview.studentDecision === "ACCEPTED") return "accepted";
    if (interview.studentDecision === "RESCHEDULE_REQUESTED") return "rescheduled";

    const time = getInterviewTime(interview);
    if (time !== null && time < Date.now()) return "past";

    return "upcoming";
};

const sortInterviews = (interviews) => {
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
};

function Interviews({ preview = false }) {
    const { dark } = useOutletContext();
    const { t, i18n } = useTranslation();
    const s = getPostInternshipClasses(dark);

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { hash } = useLocation();

    // Filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    // Form / Action states
    const [confirmId, setConfirmId] = useState(null);
    const [activeMode, setActiveMode] = useState(null); // "REJECT" | "RESCHEDULE" | null
    const [rejectComment, setRejectComment] = useState("");
    const [nouvelDate, setNouvelDate] = useState("");
    const [busyId, setBusyId] = useState(null);

    const loadInterviews = useCallback(async () => {
        try {
            const data = await getStudentInterviews();
            if (!Array.isArray(data)) throw new Error("Invalid interviews response");
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
        setActiveMode(null);
        setRejectComment("");
        setNouvelDate("");
    };

    const startReject = (interview) => {
        setConfirmId(interview.id);
        setActiveMode("REJECT");
        setRejectComment(interview.studentRejectionComment ?? interview.rejectionMessage ?? "");
        setNouvelDate("");
    };

    const startReschedule = (interview) => {
        setConfirmId(interview.id);
        setActiveMode("RESCHEDULE");
        setRejectComment(interview.studentRejectionComment ?? "");
        setNouvelDate(interview.proposedDate ?? "");
    };

    const handleAccept = async (interviewId) => {
        setBusyId(interviewId);
        try {
            await acceptInterviews(interviewId);
            await loadInterviews();
        } catch (err) {
            console.error("Failed to accept interview:", err);
        } finally {
            setBusyId(null);
        }
    };

    const handleDeny = async (interviewId) => {
        setBusyId(interviewId);
        try {
            await denyInterviews(interviewId, rejectComment.trim());
            closeForm();
            await loadInterviews();
        } catch (err) {
            console.error("Failed to deny interview:", err);
        } finally {
            setBusyId(null);
        }
    };

    const handleReschedule = async (interviewId) => {
        setBusyId(interviewId);
        try {
            await rescheduleInterviews(interviewId, rejectComment.trim(), nouvelDate);
            closeForm();
            await loadInterviews();
        } catch (err) {
            console.error("Failed to reschedule interview:", err);
        } finally {
            setBusyId(null);
        }
    };

    const visibleInterviews = sortInterviews(interviews).filter((interview) => {
        const query = search.trim().toLowerCase();
        const status = getInterviewStatus(interview);

        const matchesSearch =
            (interview.internshipTitle ?? "").toLowerCase().includes(query) ||
            (interview.employerName ?? "").toLowerCase().includes(query);

        const matchesStatus = statusFilter === "ALL" || status === statusFilter;
        const matchesType = typeFilter === "ALL" || interview.meetingType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const shown = visibleInterviews;

    useEffect(() => {
        if (preview || loading || !hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }, [hash, loading, preview]);

    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
        dark ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"
    }`;

    const renderCard = (interview) => (
        <InterviewCard
            key={interview.id}
            interview={interview}
            dark={dark}
            locale={locale}
            hash={hash}
            preview={preview}
            busy={busyId === interview.id}
            activeMode={confirmId === interview.id ? activeMode : null}
            rejectComment={rejectComment}
            nouvelDate={nouvelDate}
            onRejectCommentChange={setRejectComment}
            onNouvelDateChange={setNouvelDate}
            onAccept={handleAccept}
            onStartReject={startReject}
            onStartReschedule={startReschedule}
            onDeny={handleDeny}
            onReschedule={handleReschedule}
            onCloseForm={closeForm}
        />
    );

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
                    <h1 className={s.title}>{t("studentInterviews.title")}</h1>
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
                                className={inputClass}
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
                                className={inputClass}
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
                                className={inputClass}
                            >
                                <option value="ALL">{t("studentInterviews.filters.allTypes")}</option>
                                <option value="ONLINE">{t("studentInterviews.types.ONLINE")}</option>
                                <option value="IN_PERSON">{t("studentInterviews.types.IN_PERSON")}</option>
                                <option value="PHONE">{t("studentInterviews.types.PHONE")}</option>
                            </select>
                        </div>
                    </div>

                    {loading && <p className={s.loadingText}>{t("studentInterviews.loading")}</p>}

                    {!loading && error && (
                        <p className={s.errorText} role="alert">{t("studentInterviews.loadError")}</p>
                    )}

                    {!loading && !error && visibleInterviews.length === 0 && (
                        <p className={s.emptyText}>
                            {t(interviews.length === 0 ? "studentInterviews.empty" : "studentInterviews.filters.noResults")}
                        </p>
                    )}

                    {!loading && !error && shown.map(renderCard)}
                </div>
            </div>
        </div>
    );
}

export default Interviews;