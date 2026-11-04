import {useCallback, useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getInternshipCardClasses, getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import Icon from "../../../styles/Icon.jsx";
import {getStudentInterviews} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";

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

function Interviews() {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const cardS = getInternshipCardClasses(dark);

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

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
    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
    const muted = dark ? "text-slate-400" : "text-slate-500";
    const sectionBorder = dark ? "border-slate-700" : "border-slate-200";

    return (<div className={s.page}>
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

                    {!loading && !error && visibleInterviews.map(interview => {
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
                        const statusClasses = cancelled ? (dark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700") : past ? (dark ? "border-slate-500/30 bg-slate-500/10 text-slate-200" : "border-slate-300 bg-slate-100 text-slate-700") : (dark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700");

                        return (<article
                                key={interview.id}
                                className={`${cardS.card} border-l-4 ${accentBorder} ${dark ? "bg-slate-800" : "bg-white"}`}
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

                                    <span
                                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${statusClasses}`}>
                                        <Icon name={statusIcon} size={18}/>
                                        <span>{t(`studentInterviews.statuses.${status}`)}</span>
                                    </span>
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
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Interviews;