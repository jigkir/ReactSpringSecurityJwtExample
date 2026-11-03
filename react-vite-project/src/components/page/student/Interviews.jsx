import {useCallback, useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import {getStudentInterviews} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";

const getInterviewTime = (interview) => {
    const raw = interview.scheduledAt ?? interview.interviewDate;
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

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const visibleInterviews = sortInterviews(interviews);
    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
    const cardClasses = dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900";
    const labelClasses = dark ? "text-slate-400" : "text-slate-500";

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

                    {loading && (
                        <p className={s.loadingText}>
                            {t("studentInterviews.loading")}
                        </p>
                    )}

                    {!loading && error && (
                        <p className={s.errorText} role="alert">
                            {t("studentInterviews.loadError")}
                        </p>
                    )}

                    {!loading && !error && visibleInterviews.length === 0 && (
                        <p className={s.emptyText}>
                            {t("studentInterviews.empty")}
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

                        const statusClasses = cancelled ? "bg-red-100 text-red-800" : past
                            ? "bg-slate-200 text-slate-700"
                            : "bg-green-100 text-green-800";

                        return (
                            <article
                                key={interview.id}
                                className={`rounded-xl border p-5 shadow-sm ${cardClasses}`}
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {interview.internshipTitle}
                                        </h2>
                                        <p className={labelClasses}>
                                            {interview.employerName}
                                        </p>
                                    </div>

                                    <span className={`h-fit w-fit rounded-full px-3 py-1 text-sm ${statusClasses}`}>
                                        {t(`studentInterviews.statuses.${status}`)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className={`text-sm ${labelClasses}`}>
                                            {t("studentInterviews.date")}
                                        </p>
                                        <p>{formattedDate}</p>
                                    </div>

                                    <div>
                                        <p className={`text-sm ${labelClasses}`}>
                                            {t("studentInterviews.type")}
                                        </p>
                                        <p>
                                            {t(`studentInterviews.types.${interview.meetingType}`)}
                                        </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <p className={`text-sm ${labelClasses}`}>
                                            {t("studentInterviews.details")}
                                        </p>

                                        {meetingUrl ? (
                                            <a
                                                href={meetingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 underline"
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

                                    <div className="sm:col-span-2">
                                        <p className={`text-sm ${labelClasses}`}>
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