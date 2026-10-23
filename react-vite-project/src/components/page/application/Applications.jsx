/**
 * Employer page: every application received, grouped by the internship offer it comes from.
 * Location: src/components/page/application/Applications.jsx
 *
 * - One section per internship (title + number of applications, unread count).
 * - A dropdown lets the employer pick which internship to look at ("All internships" by default).
 * - Search by student / email / CV name.
 * - Previewing a CV marks the application as read (same behaviour as ViewApplications).
 * Access control: <RequireRole roles={["EMPLOYER"]}/> in App.jsx + backend.
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {NavLink, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import ApplicationCard from './ApplicationCard.jsx';
import Icon from '../../../styles/Icon.jsx';
import {getPostInternshipClasses} from '../../../styles/AppStyles.jsx';
import {getApplicationCv, getApplications, getEmployerInternships} from '../../api/Api.jsx';
import {base64ToBlobUrl} from '../cv/cvUtils.js';
import {matchesSearch, toNum} from '../../../utils/Sort.jsx';
import {useNotifications} from '../../notification/NotificationsProvider.jsx';
import {usePolling} from '../../../utils/usePolling.js';

const ALL = "ALL";

const isUnread = (a) => a.internshipApplicationStatus === "UNREAD";

// Unread first, then newest (highest id) first
const compareApplications = (a, b) =>
    Number(isUnread(b)) - Number(isUnread(a)) || (toNum(b.id) ?? 0) - (toNum(a.id) ?? 0);

function Applications({user}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {refresh} = useNotifications();
    const s = getPostInternshipClasses(dark);
    const isLoggedIn = Boolean(user?.isLoggedIn);

    const [applications, setApplications] = useState(null); // null = loading
    const [internships, setInternships] = useState([]);
    const [loadFailed, setLoadFailed] = useState(false);
    const [search, setSearch] = useState("");
    const [internshipFilter, setInternshipFilter] = useState(ALL);
    const [openPreviewIds, setOpenPreviewIds] = useState([]);

    const controlClass = `rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    const load = useCallback(async () => {
        try {
            const [apps, offers] = await Promise.all([getApplications(), getEmployerInternships()]);
            setApplications(Array.isArray(apps) ? apps : []);
            setInternships(Array.isArray(offers) ? offers : []);
            setLoadFailed(false);
        } catch {
            setLoadFailed(true);
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) void load();
    }, [isLoggedIn, load]);

    usePolling(load, isLoggedIn);

    // internshipId -> title (the application's own title wins when the API provides one)
    const titleById = useMemo(
        () => new Map(internships.map((i) => [i.id, i.title])),
        [internships],
    );
    const titleOf = useCallback(
        (app) => app.internshipTitle ?? titleById.get(app.internshipId) ?? t("applicationsPage.unknownInternship"),
        [titleById, t],
    );

    // One group per internship that has at least one application: [{id, title, apps, unread}]
    const groups = useMemo(() => {
        if (!applications) return [];
        const byInternship = new Map();
        for (const app of applications) {
            if (!byInternship.has(app.internshipId)) byInternship.set(app.internshipId, []);
            byInternship.get(app.internshipId).push(app);
        }
        return [...byInternship.entries()]
            .map(([id, apps]) => ({
                id,
                title: titleOf(apps[0]),
                total: apps.length,
                unread: apps.filter(isUnread).length,
                apps,
            }))
            // Internships with unread applications first, then alphabetical
            .sort((a, b) => Number(b.unread > 0) - Number(a.unread > 0) || a.title.localeCompare(b.title));
    }, [applications, titleOf]);

    // Apply the internship filter + search, then drop empty groups
    const visibleGroups = useMemo(() => groups
        .filter((g) => internshipFilter === ALL || String(g.id) === internshipFilter)
        .map((g) => ({
            ...g,
            apps: g.apps
                .filter((a) => matchesSearch(
                    [a.student?.firstName, a.student?.lastName, a.student?.email, a.cvFileName],
                    search,
                ))
                .sort(compareApplications),
        }))
        .filter((g) => g.apps.length > 0),
    [groups, internshipFilter, search]);

    const togglePreview = (id) =>
        setOpenPreviewIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

    const getUrl = useCallback(async (appId) => {
        const cv = await getApplicationCv(appId);
        if (!cv?.content) throw new Error("missing content");

        // Optimistic update: the "New" sticker disappears as soon as the CV is viewed
        setApplications((prev) => prev?.map((app) =>
            app.id === appId && isUnread(app) ? {...app, internshipApplicationStatus: "READ"} : app));
        void refresh();

        return base64ToBlobUrl(cv.content);
    }, [refresh]);

    const headerText = dark ? "text-white" : "text-gray-900";
    const mutedText = dark ? "text-slate-400" : "text-gray-500";

    let body;
    if (loadFailed) {
        body = <p className={s.errorText} role="alert">{t("applicationsPage.loadError")}</p>;
    } else if (applications === null) {
        body = <p className={s.loadingText} aria-busy="true">{t("applicationsPage.loading")}</p>;
    } else if (applications.length === 0) {
        body = <p className={s.emptyText}>{t("applicationsPage.empty")}</p>;
    } else if (visibleGroups.length === 0) {
        body = <p className={s.emptyText}>{t("applicationsPage.noMatch")}</p>;
    } else {
        body = visibleGroups.map((group) => (
            <section key={group.id} className="space-y-3" aria-label={group.title}>
                {/* Which internship these applications come from */}
                <div className={`flex flex-wrap items-center gap-3 pb-2 border-b ${dark ? "border-slate-700" : "border-gray-200"}`}>
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold uppercase tracking-wide ${mutedText}`}>
                            {t("applicationsPage.fromInternship")}
                        </p>
                        <h2 className={`text-xl font-bold break-words ${headerText}`}>{group.title}</h2>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                        dark ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-700"}`}>
                        <Icon name="send" size={16}/>
                        {t("applicationsPage.applicationCount", {count: group.total})}
                    </span>
                    {group.unread > 0 && (
                        <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm font-bold text-white">
                            {t("applicationsPage.unreadCount", {count: group.unread})}
                        </span>
                    )}
                    <NavLink
                        to={`/application/${group.id}`}
                        className="px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1 transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        {t("applicationsPage.openInternship")}
                    </NavLink>
                </div>

                {group.apps.map((application) => (
                    <ApplicationCard
                        key={application.id}
                        application={application}
                        isNew={isUnread(application)}
                        dark={dark}
                        isPreviewOpen={openPreviewIds.includes(application.id)}
                        onTogglePreview={() => togglePreview(application.id)}
                        getUrl={getUrl}
                    />
                ))}
            </section>
        ));
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("applicationsPage.title")}</h1>
                    <p className={s.subtitle}>{t("applicationsPage.subtitle")}</p>
                </div>
            </div>

            <div className={s.listSection}>
                {applications && applications.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {/* Pick the internship */}
                        <select
                            value={internshipFilter}
                            onChange={(e) => setInternshipFilter(e.target.value)}
                            className={`${controlClass} max-w-full md:max-w-xs`}
                            aria-label={t("applicationsPage.internshipAria")}
                        >
                            <option value={ALL}>{t("applicationsPage.allInternships")}</option>
                            {groups.map((g) => (
                                <option key={g.id} value={String(g.id)}>
                                    {g.title} ({g.total})
                                </option>
                            ))}
                        </select>

                        <div className="relative w-full md:w-64">
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("applicationsPage.searchPlaceholder")}
                                aria-label={t("applicationsPage.searchAria")}
                                className={`${controlClass} w-full pr-8 [&::-webkit-search-cancel-button]:appearance-none`}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label={t("applicationsPage.clearSearchAria")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 flex text-red-500 hover:text-red-600"
                                >
                                    <Icon name="close" size={18}/>
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <div className={`${s.scrollArea} space-y-8`}>{body}</div>
            </div>
        </div>
    );
}

export default Applications;