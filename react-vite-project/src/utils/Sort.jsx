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
 * Display order
 *   CVs:         REJECTED → PENDING → APPROVED
 *   Internships: PENDING → APPROVED → REJECTED   (pending offers first, rejected ones never first)
 * The status always comes first; the chosen sort only orders items inside the same status.
 *
 * The student internships page then regroups its list as NEW → APPLIED → OLD
 * (see pages/student/Internships.jsx); the chosen sort orders items inside each group.
 */

import {useMemo, useState} from 'react';

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

// Display order of statuses for CVs: rejected first, then pending, then approved
const STATUS_RANK = {REJECTED: 0, PENDING: 1, APPROVED: 2};

// Display order of statuses for internship offers: pending first, then approved, rejected last
const INTERNSHIP_STATUS_RANK = {PENDING: 0, APPROVED: 1, REJECTED: 2};

// A missing or unknown status counts as PENDING
export const statusRank = (item, ranks = STATUS_RANK) =>
    ranks[item.status ?? "PENDING"] ?? ranks.PENDING;

// Wraps a comparator so the status order always wins; `cmp` only orders items of the same status
export const byStatusThen = (cmp, ranks = STATUS_RANK) => (a, b) =>
    statusRank(a, ranks) - statusRank(b, ranks) || cmp(a, b);

// True if the lower-cased search text appears in any of the given values
export const matchesSearch = (values, search) => {
    const q = (search ?? "").trim().toLowerCase();
    if (!q) return true;
    return values.filter(Boolean).join(" ").toLowerCase().includes(q);
};

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

/**
 * `applied` ("ALL" | "APPLIED" | "NOT_APPLIED") and `appliedIds` (Set of internship ids the student
 * applied to) are student-side only: without `appliedIds` the applied filter does nothing.
 */
export function filterInternships(list, {
    search = "", status = "ALL", discipline = "ALL", applied = "ALL", appliedIds = null
} = {}) {
    return list.filter((i) => {
        if (status !== "ALL" && i.status !== status) return false;
        if (discipline !== "ALL" && i.discipline !== discipline) return false;
        if (appliedIds && applied !== "ALL" && appliedIds.has(i.id) !== (applied === "APPLIED")) return false;
        return matchesSearch([i.title, i.description, i.requiredSkills, i.location, i.employerEmail], search);
    });
}

/** Status order first (PENDING → APPROVED → REJECTED), then the chosen sort. */
export function sortInternships(list, sort = "NEWEST") {
    return [...list].sort(
        byStatusThen(INTERNSHIP_SORTERS[sort] ?? INTERNSHIP_SORTERS.NEWEST, INTERNSHIP_STATUS_RANK));
}

export function applyInternshipFilters(list, {
    search, status, discipline, sort, applied, appliedIds
} = {}) {
    if (!list) return null;
    return sortInternships(
        filterInternships(list, {search, status, discipline, applied, appliedIds}), sort);
}

/**
 * Owns the filter state and returns the visible list (null while `list` is null).
 * `appliedIds` (optional, a stable Set) enables the applied / not applied filter.
 */
export function useInternshipFilters(list, appliedIds = null) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [discipline, setDiscipline] = useState("ALL");
    const [applied, setApplied] = useState("ALL");
    const [sort, setSort] = useState("NEWEST");

    const disciplines = useMemo(() => getInternshipDisciplines(list), [list]);
    const visible = useMemo(
        () => applyInternshipFilters(list, {search, status, discipline, sort, applied, appliedIds}),
        [list, search, status, discipline, sort, applied, appliedIds],
    );

    return {
        search, setSearch, status, setStatus, discipline, setDiscipline, sort, setSort,
        applied, setApplied,
        disciplines, visible,
        filtersActive: search.trim() !== "" || status !== "ALL" || discipline !== "ALL" || applied !== "ALL",
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

    const disciplines = useMemo(() => getCvDisciplines(docs ?? []), [docs]);
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