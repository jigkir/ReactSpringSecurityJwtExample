import {useCallback, useEffect, useState} from "react";
import {useLocation, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import {acceptInterviews, denyInterviews, getStudentInterviews} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {StatusColorSelect, useColorParam} from "../../../utils/Sort.jsx";
import {ALL, matchesColor} from "../../../utils/StatusColor.js";
import InterviewCard from "./InterviewCard.jsx";
import {getInterviewColor, getInterviewTime, isCancelled} from "../../../utils/interviewStatus.js";

function Interviews() {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const s = getPostInternshipClasses(dark);

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const {hash} = useLocation();

    // Filter states (the status filter is a color: ALL | RED | YELLOW | GREEN, initial value from ?status=)
    const initialStatus = useColorParam("status");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [typeFilter, setTypeFilter] = useState(ALL);

    // Form / Action states
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectComment, setRejectComment] = useState("");
    const [busyId, setBusyId] = useState(null);

    const loadInterviews = useCallback(async () => {
        try {
            const data = await getStudentInterviews();
            if (!Array.isArray(data)) {
                setError(true);
                return;
            }
            setInterviews(data);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

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

    useEffect(() => {
        void loadInterviews();
    }, [loadInterviews]);

    usePolling(loadInterviews);

    const closeForm = () => {
        setRejectingId(null);
        setRejectComment("");
    };

    const startReject = (interviewId) => {
        setRejectingId(interviewId);
        setRejectComment("");
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

    const visibleInterviews = sortInterviews(interviews).filter((interview) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
            (interview.internshipTitle ?? "").toLowerCase().includes(query) ||
            (interview.employerName ?? "").toLowerCase().includes(query);

        // A past interview has no color: it only shows with ALL
        const matchesStatus = matchesColor(getInterviewColor(interview), statusFilter);
        const matchesType = typeFilter === ALL || interview.meetingType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    useEffect(() => {
        if (loading || !hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView?.({behavior: "smooth", block: "center"});
    }, [hash, loading]);

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
            filterColor={statusFilter}
            busy={busyId === interview.id}
            rejecting={rejectingId === interview.id}
            rejectComment={rejectComment}
            onRejectCommentChange={setRejectComment}
            onAccept={handleAccept}
            onStartReject={startReject}
            onDeny={handleDeny}
            onCloseForm={closeForm}
        />
    );

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
                            <StatusColorSelect
                                id="interview-status"
                                dark={dark}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                page="studentInterviews"
                                ariaLabel={t("studentInterviews.filters.status")}
                                className="w-full"
                            />
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

                    {!loading && !error && visibleInterviews.map(renderCard)}
                </div>
            </div>
        </div>
    );
}

export default Interviews;