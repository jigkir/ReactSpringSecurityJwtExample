import {useCallback, useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getInternshipCardClasses, getPostInternshipClasses} from "../../../../styles/AppStyles.jsx";
import Icon from "../../../../styles/Icon.jsx";
import {getEmployerInterviews} from "../../../api/Api.jsx";
import {usePolling} from "../../../../utils/usePolling.js";

const isCancelled = (i) => i.interviewStatus === "CANCELLED";

const getStatus = (i) => {
    if (isCancelled(i)) return "cancelled";
    const time = i.interviewDate;
    if (time !== null && time < Date.now()) return "past";
    return "upcoming";
};

// Upcoming (soonest first) → past (most recent first) → cancelled
const sortInterviews = (list) => {
    const now = Date.now();
    const group = (i) => (isCancelled(i) ? 2 : (getTime(i) ?? 0) >= now ? 0 : 1);
    return [...list].sort((a, b) => {
        const ga = group(a), gb = group(b);
        if (ga !== gb) return ga - gb;
        const ta = getTime(a) ?? 0, tb = getTime(b) ?? 0;
        return ga === 0 ? ta - tb : tb - ta;
    });
};

// Adjust to whatever your employer DTO returns
const studentName = (i) =>
    i.studentName ?? (i.student ? `${i.student.firstName} ${i.student.lastName}` : "");

function EmployerInterviews({user}) {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const cardS = getInternshipCardClasses(dark);
    const isLoggedIn = Boolean(user?.isLoggedIn);

    const [interviews, setInterviews] = useState(null); // null = loading
    const [loadFailed, setLoadFailed] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getEmployerInterviews();
            if (!Array.isArray(data)) throw new Error("Invalid interviews response");
            setInterviews(data);
            setLoadFailed(false);
        } catch {
            setLoadFailed(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;
        void load();
    }, [load]);

    usePolling(load);

    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
    const muted = dark ? "text-slate-400" : "text-slate-500";

    const renderCard = (interview) => {
        const status = getStatus(interview);
        const accent = status === "cancelled" ? "border-l-red-500"
            : status === "past" ? "border-l-slate-400" : "border-l-emerald-500";

        return (
            <article key={interview.id} className={`${cardS.card} border-l-4 ${accent}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className={`${cardS.title} break-words`}>{interview.internshipTitle}</h2>
                        {studentName(interview) && (
                            <p className={`mt-1 text-sm ${muted}`}>{studentName(interview)}</p>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold">
                        <Icon name={status === "cancelled" ? "close" : status === "past" ? "check_circle" : "schedule"} size={18}/>
                        {t(`employerInterviews.statuses.${status}`)}
                    </span>
                </div>

                <div className={`${cardS.detailsRow} mt-4`}>
                    <span className={cardS.detailBadge}>
                        <Icon name="event" size={20}/>{interview.interviewDate}
                    </span>
                    <span className={cardS.detailBadge}>
                        {t(`employerInterviews.types.${interview.meetingType}`)}
                    </span>
                    {interview.studentDecision && (
                        <span className={cardS.detailBadge}>
                            {t(`employerInterviews.decisions.${interview.studentDecision}`)}
                        </span>
                    )}
                </div>

                <div className="mt-3 space-y-1 break-words">
                    <p className={`text-sm font-semibold ${muted}`}>{t("employerInterviews.details")}</p>
                    <p>{interview.meetingDetails || t("employerInterviews.notProvided")}</p>
                </div>

                {interview.studentDecision === "REJECTED" && interview.studentRejectionComment && (
                    <div className={`mt-3 rounded-lg border-l-4 border-red-500 px-3 py-2 ${dark ? "bg-red-900/30" : "bg-red-50"}`}>
                        <p className="text-xs font-bold uppercase">{t("employerInterviews.rejectionReason")}</p>
                        <p className="text-sm whitespace-pre-wrap">{interview.studentRejectionComment}</p>
                    </div>
                )}
            </article>
        );
    };

    let body;
    if (loadFailed && interviews === null) {
        body = <p className={s.errorText} role="alert">{t("employerInterviews.loadError")}</p>;
    } else if (interviews === null) {
        body = <p className={s.loadingText} aria-busy="true">{t("employerInterviews.loading")}</p>;
    } else if (interviews.length === 0) {
        body = <p className={s.emptyText}>{t("employerInterviews.empty")}</p>;
    } else {
        body = sortInterviews(interviews).map(renderCard);
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("employerInterviews.title")}</h1>
                    <p className={s.subtitle}>{t("employerInterviews.subtitle")}</p>
                </div>
            </div>
            <div className={s.listSection}>
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
}

export default EmployerInterviews;