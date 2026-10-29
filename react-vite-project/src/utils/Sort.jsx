/**
 * Sort.jsx — Every sort / filter function of the app, in one place.
 * Location: src/utils/Sort.jsx
 *
 * Layout
 *   1. Generic helpers          (toNum, compareText, compareDate, matchesSearch, countByStatus)
 *   2. Internships              (sorters, options, filter, hooks)
 *   3. CVs                      (sorters, filter, disciplines, hook)
 *
 * Pure functions come first (easy to test); the React hooks at the bottom of each
 * section only own the UI state (search / status / sort) and call those functions.
 *
 * Sort options are [value, translationKey] pairs so components just map over them.
 *
 * Display order everywhere (CVs and internships, Home included):
 *   REJECTED → PENDING → APPROVED
 * The status always comes first; the chosen sort only orders items inside the same status.
 */

import {useMemo, useRef, useState} from 'react';

// ─── 1. Generic helpers ───────────────────────────────────────────────────────

export const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// Numeric compare when both ids are numbers, string compare otherwise
export const compareId = (a, b) => {
    const x = toNum(a.id);
    const y = toNum(b.id);
    return x !== null && y !== null ? x - y : String(a.id).localeCompare(String(b.id));
};

// ISO dates (YYYY-MM-DD) sort correctly as strings
export const compareIsoDate = (field) => (a, b) =>
    String(a[field] ?? "").localeCompare(String(b[field] ?? ""));

// Full timestamps (e.g. uploadedAt)
export const compareTimestamp = (field) => (a, b) => new Date(a[field]) - new Date(b[field]);

export const compareText = (field) => (a, b) => (a[field] ?? "").localeCompare(b[field] ?? "");

export const reverse = (cmp) => (a, b) => cmp(b, a);

// Display order of statuses: rejected first, then pending, then approved
const STATUS_RANK = {REJECTED: 0, PENDING: 1, APPROVED: 2};

// A missing or unknown status counts as PENDING
export const statusRank = (item) => STATUS_RANK[item.status ?? "PENDING"] ?? STATUS_RANK.PENDING;

// Wraps a comparator so the status order always wins; `cmp` only orders items of the same status
export const byStatusThen = (cmp) => (a, b) => statusRank(a) - statusRank(b) || cmp(a, b);

// True if the lower-cased search text appears in any of the given values
export const matchesSearch = (values, search) => {
    const q = (search ?? "").trim().toLowerCase();
    if (!q) return true;
    return values.filter(Boolean).join(" ").toLowerCase().includes(q);
};

/**
 * Counts items per status for CVs and internships.
 * A missing status counts as PENDING.
 * Returns {PENDING, APPROVED, REJECTED}.
 */
export const countByStatus = (list) => (list ?? []).reduce((acc, d) => {
    const key = d.status ?? "PENDING";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
}, {PENDING: 0, APPROVED: 0, REJECTED: 0});

// ─── 2. Internships ───────────────────────────────────────────────────────────

const internshipPay = (i) =>
    i.compensationNegotiable || i.compensationAmount == null ? -1 : Number(i.compensationAmount);

// Upload date first (offers without a date count as oldest), then id
const compareUpload = (a, b) =>
    String(a.uploadedAt ?? "").localeCompare(String(b.uploadedAt ?? "")) || compareId(a, b);

export const INTERNSHIP_SORTERS = {
    NEWEST: reverse(compareUpload),
    OLDEST: compareUpload,
    DEADLINE_ASC: compareIsoDate("applicationDeadline"),
    START_ASC: compareIsoDate("startDate"),
    TITLE_ASC: compareText("title"),
    TITLE_DESC: reverse(compareText("title")),
    PAY_DESC: (a, b) => internshipPay(b) - internshipPay(a),
};

// Sort option value -> translation key
export const INTERNSHIP_SORT_OPTIONS = [
    ["NEWEST", "internshipFilters.newest"],
    ["OLDEST", "internshipFilters.oldest"],
    ["DEADLINE_ASC", "internshipFilters.deadlineAsc"],
    ["START_ASC", "internshipFilters.startAsc"],
    ["TITLE_ASC", "internshipFilters.titleAsc"],
    ["TITLE_DESC", "internshipFilters.titleDesc"],
    ["PAY_DESC", "internshipFilters.payDesc"],
];

/** Distinct, sorted disciplines found in an internship list (manager view). */
export const getInternshipDisciplines = (list) =>
    [...new Set((list ?? []).map((i) => i.discipline).filter(Boolean))].sort();

export function filterInternships(list, {search = "", status = "ALL", discipline = "ALL"} = {}) {
    return list.filter((i) => {
        if (status !== "ALL" && i.status !== status) return false;
        if (discipline !== "ALL" && i.discipline !== discipline) return false;
        return matchesSearch([i.title, i.description, i.requiredSkills, i.location, i.employerEmail], search);
    });
}

/**
 * Status order first (REJECTED → PENDING → APPROVED), then the chosen sort.
 *
 * `viewedAtLoad` (optional Map id -> boolean) is the "viewed" state each offer had when it
 * first appeared on the page. With "Newest first", offers that were NOT viewed at that time
 * go on top (inside the same status). Because the state is frozen, previewing an offer does
 * not move it: it only moves after a page change / reload (when the map is rebuilt).
 */
export function sortInternships(list, sort = "NEWEST", viewedAtLoad = null) {
    const base = byStatusThen(INTERNSHIP_SORTERS[sort] ?? INTERNSHIP_SORTERS.NEWEST);
    if (!viewedAtLoad || (sort !== "NEWEST" && INTERNSHIP_SORTERS[sort])) return [...list].sort(base);

    const wasViewed = (i) => Number(viewedAtLoad.get(i.id) ?? Boolean(i.viewed));
    return [...list].sort((a, b) =>
        statusRank(a) - statusRank(b) || wasViewed(a) - wasViewed(b) || base(a, b));
}

export function applyInternshipFilters(list, {search, status, discipline, sort, viewedAtLoad} = {}) {
    if (!list) return null;
    return sortInternships(filterInternships(list, {search, status, discipline}), sort, viewedAtLoad);
}

/** Owns the filter state and returns the visible list (null while `list` is null). */
export function useInternshipFilters(list) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [discipline, setDiscipline] = useState("ALL");
    const [sort, setSort] = useState("NEWEST");

    // "Viewed" state of each offer the first time it appears. Lives as long as the page
    // (reset on page change), so previewing an offer never reorders the list.
    const viewedAtLoad = useRef(new Map());

    const disciplines = useMemo(() => getInternshipDisciplines(list), [list]);
    const visible = useMemo(() => {
        for (const i of list ?? []) {
            if (!viewedAtLoad.current.has(i.id)) viewedAtLoad.current.set(i.id, Boolean(i.viewed));
        }
        return applyInternshipFilters(list, {
            search, status, discipline, sort, viewedAtLoad: viewedAtLoad.current,
        });
    }, [list, search, status, discipline, sort]);

    return {
        search, setSearch, status, setStatus, discipline, setDiscipline, sort, setSort,
        disciplines, visible,
        filtersActive: search.trim() !== "" || status !== "ALL" || discipline !== "ALL",
    };
}

// ─── 3. CVs ───────────────────────────────────────────────────────────────────

const compareStudentName = (a, b) =>
    (a.student?.lastName ?? "").localeCompare(b.student?.lastName ?? "") ||
    (a.student?.firstName ?? "").localeCompare(b.student?.firstName ?? "");

export const CV_SORTERS = {
    DATE_DESC: reverse(compareTimestamp("uploadedAt")),
    DATE_ASC: compareTimestamp("uploadedAt"),
    NAME_ASC: compareStudentName,
    NAME_DESC: reverse(compareStudentName),
};

// Sort option value -> translation key
export const CV_SORT_OPTIONS = [
    ["DATE_DESC", "cvDocuments.sortNewest"],
    ["DATE_ASC", "cvDocuments.sortOldest"],
    ["NAME_ASC", "cvDocuments.sortNameAsc"],
    ["NAME_DESC", "cvDocuments.sortNameDesc"],
];

/** Student side: REJECTED → PENDING → APPROVED, newest first inside each status. */
export const sortCvsNewest = (list) => [...list].sort(byStatusThen(CV_SORTERS.DATE_DESC));

/** Distinct, sorted disciplines found in a manager CV list. */
export const getCvDisciplines = (docs) =>
    [...new Set((docs ?? []).map((d) => d.student?.discipline).filter(Boolean))].sort();

export function filterCvs(docs, {status = "ALL", discipline = "ALL", search = ""} = {}) {
    return docs.filter((d) => {
        if (status !== "ALL" && d.status !== status) return false;
        if (discipline !== "ALL" && d.student?.discipline !== discipline) return false;
        const s = d.student ?? {};
        return matchesSearch([s.firstName, s.lastName, s.email, s.studentId, d.fileName], search);
    });
}

export function sortCvs(docs, sort = "DATE_DESC") {
    return [...docs].sort(byStatusThen(CV_SORTERS[sort] ?? CV_SORTERS.DATE_DESC));
}

export function applyCvFilters(docs, {status, discipline, search, sort} = {}) {
    if (!docs) return null;
    return sortCvs(filterCvs(docs, {status, discipline, search}), sort);
}

/** Manager CV list: owns the filter state and returns the visible list + disciplines. */
export function useCvFilters(docs) {
    const [status, setStatus] = useState("ALL");
    const [discipline, setDiscipline] = useState("ALL");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("DATE_DESC");

    const disciplines = useMemo(() => getCvDisciplines(docs), [docs]);
    const visible = useMemo(
        () => applyCvFilters(docs, {status, discipline, search, sort}),
        [docs, status, discipline, search, sort],
    );

    return {
        status, setStatus, discipline, setDiscipline, search, setSearch, sort, setSort,
        disciplines, visible,
    };
}

export function sortApplication(applications, id) {
    return applications.filter(app => app.internshipId === id);
}