import {useCallback, useEffect, useMemo, useState} from "react";
import {useLocation, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import {useLoadedList} from "../../../utils/useLoadedList.js";
import {ALL, matchesColor} from "../../../utils/StatusColor.js";
import {StatusColorSelect, useColorFilter} from "../../../utils/Sort.jsx";
import {getInterviewColor, sortInterviews} from "../../../utils/interviewStatus.js";
import {getInterviewRole, INTERVIEW_ROLES} from "../../../utils/InterviewRole.js";
import InterviewCard from "./InterviewCard.jsx";

export default function InterviewList({user, audience}) {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const role = audience ? INTERVIEW_ROLES[audience] : getInterviewRole(user);
    const {hash} = useLocation();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useColorFilter("status");
    const [type, setType] = useState(ALL);
    const fetchList = useCallback(async () => {
        const data = await role.fetchList();
        if (!Array.isArray(data)) throw new Error("Unexpected interview list");
        return data;
    }, [role]);
    const {items, failed, reload} = useLoadedList(fetchList);
    const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";

    const visible = useMemo(() => {
        if (!items) return null;
        const query = search.trim().toLowerCase();
        return sortInterviews(items.filter((item) => {
            const title = String(item.internshipTitle ?? "").toLowerCase();
            const name = String(role.can.accept ? item.employerName : (item.studentName ?? "")).toLowerCase();
            return (!query || title.includes(query) || name.includes(query))
                && matchesColor(getInterviewColor(item), status)
                && (type === ALL || item.meetingType === type);
        }));
    }, [items, search, status, type, role]);

    useEffect(() => {
        if (!items || !hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView?.({behavior: "smooth", block: "center"});
    }, [hash, items]);

    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${dark ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`;
    let body;
    if (failed && items === null) body = <p className={s.errorText} role="alert">{t(role.can.accept ? "studentInterviews.loadError" : "employerInterviews.loadError")}</p>;
    else if (items === null) body = <p className={s.loadingText} aria-busy="true">{t(role.can.accept ? "studentInterviews.loading" : "employerInterviews.loading")}</p>;
    else if (items.length === 0) body = <p className={s.emptyText}>{t(role.can.accept ? "studentInterviews.empty" : "employerInterviews.empty")}</p>;
    else if (visible.length === 0) body = <p className={s.emptyText}>{t(role.can.accept ? "studentInterviews.filters.noResults" : "employerInterviews.noMatch")}</p>;
    else body = visible.map((item) => (
        <InterviewCard key={item.id} interview={item} dark={dark} locale={locale} hash={hash}
                       filterColor={status} role={role} reload={reload}/>
    ));

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div><h1 className={s.title}>{t(role.can.accept ? "studentInterviews.title" : "employerInterviews.title")}</h1>
                    {role.can.edit && <p className={s.subtitle}>{t("employerInterviews.subtitle")}</p>}</div>
            </div>
            <div className={s.listSection}>
                {role.can.accept && (
                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div><label htmlFor="interview-search" className="mb-1 block text-sm font-medium">{t("studentInterviews.filters.search")}</label>
                            <input id="interview-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                                   placeholder={t("studentInterviews.filters.placeholder")} className={inputClass}/></div>
                        <div><label htmlFor="interview-status" className="mb-1 block text-sm font-medium">{t("studentInterviews.filters.status")}</label>
                            <StatusColorSelect id="interview-status" dark={dark} value={status} onChange={setStatus}
                                               page="studentInterviews" ariaLabel={t("studentInterviews.filters.status")} className="w-full"/></div>
                        <div><label htmlFor="interview-type" className="mb-1 block text-sm font-medium">{t("studentInterviews.filters.type")}</label>
                            <select id="interview-type" value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
                                <option value="ALL">{t("studentInterviews.filters.allTypes")}</option>
                                <option value="ONLINE">{t("studentInterviews.types.ONLINE")}</option>
                                <option value="IN_PERSON">{t("studentInterviews.types.IN_PERSON")}</option>
                                <option value="PHONE">{t("studentInterviews.types.PHONE")}</option>
                            </select></div>
                    </div>
                )}
                {role.can.edit && items && items.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <StatusColorSelect dark={dark} value={status} onChange={setStatus} page="employerInterviews"
                                           ariaLabel={t("employerInterviews.statusAria")}/>
                    </div>
                )}
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
}
