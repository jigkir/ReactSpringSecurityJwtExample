


import {useCallback, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getSelectClass} from "../../styles/ui/FormControls.jsx";
import {getStatusBorder} from "../../styles/theme/AppStyles.jsx";
import {ALL, COLOR, COLOR_VALUES, colorOf, matchesColor, statusLabelKey, studentStatusColor} from "../status/StatusColor.js";



export const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};


export const compareId = (a, b) => {
    const x = toNum(a.id);
    const y = toNum(b.id);
    return x !== null && y !== null ? x - y : String(a.id).localeCompare(String(b.id));
};


export const compareIsoDate = (field) => (a, b) =>
    String(a[field] ?? "").localeCompare(String(b[field] ?? ""));


export const compareTimestamp = (field) => (a, b) => new Date(a[field]) - new Date(b[field]);

export const compareText = (field) => (a, b) => (a[field] ?? "").localeCompare(b[field] ?? "");

export const reverse = (cmp) => (a, b) => cmp(b, a);


const STATUS_RANK = {REJECTED: 0, PENDING: 1, APPROVED: 2};


const INTERNSHIP_STATUS_RANK = {PENDING: 0, APPROVED: 1, REJECTED: 2};


export const EMPLOYER_INTERNSHIP_STATUS_RANK = {REJECTED: 0, PENDING: 1, APPROVED: 2};


export const statusRank = (item, ranks = STATUS_RANK) =>
    ranks[item.status ?? "PENDING"] ?? ranks.PENDING;


export const byStatusThen = (cmp, ranks = STATUS_RANK) => (a, b) =>
    statusRank(a, ranks) - statusRank(b, ranks) || cmp(a, b);


export const matchesSearch = (values, search) => {
    const q = (search ?? "").trim().toLowerCase();
    if (!q) return true;
    return values.filter(Boolean).join(" ").toLowerCase().includes(q);
};




const COLOR_SELECT_STATUS = {[COLOR.RED]: "REJECTED", [COLOR.YELLOW]: "PENDING", [COLOR.GREEN]: "APPROVED"};



export function useColorParam(name = "status", allowed = COLOR_VALUES) {
    const [params] = useSearchParams();
    const raw = (params.get(name) ?? "").toUpperCase();
    return allowed.includes(raw) ? raw : ALL;
}



export function useColorFilter(name = "status", allowed = COLOR_VALUES) {
    const [params, setParams] = useSearchParams();
    const raw = (params.get(name) ?? "").toUpperCase();
    const value = allowed.includes(raw) ? raw : ALL;

    const setValue = useCallback((color) => {
        setParams((previous) => {
            const next = new URLSearchParams(previous);
            if (color === ALL) next.delete(name);
            else next.set(name, color);
            return next;
        }, {replace: true});
    }, [name, setParams]);

    return [value, setValue];
}



export function StatusColorSelect({
                                      dark, value, onChange, ariaLabel, colors = COLOR_VALUES,
                                      className = "", id, page,
                                  }) {
    const {t} = useTranslation();
    const border = getStatusBorder(COLOR_SELECT_STATUS[value], dark);

    return (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
                aria-label={ariaLabel} className={`${getSelectClass(dark, border)} ${className}`.trim()}>
            {colors.map((color) => {
                const key = statusLabelKey(page, color);
                return <option key={color} value={color}>{key ? t(key) : color}</option>;
            })}
        </select>
    );
}



const APPLIED_COLORS = [ALL, COLOR.GREEN, COLOR.RED];

const internshipPay = (i) =>
    i.compensationNegotiable || i.compensationAmount == null ? -1 : Number(i.compensationAmount);


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


export const INTERNSHIP_SORT_OPTIONS = [
    ["NEWEST", "internshipFilters.newest"],
    ["OLDEST", "internshipFilters.oldest"],
    ["DEADLINE_ASC", "internshipFilters.deadlineAsc"],
    ["START_ASC", "internshipFilters.startAsc"],
    ["TITLE_ASC", "internshipFilters.titleAsc"],
    ["TITLE_DESC", "internshipFilters.titleDesc"],
    ["PAY_DESC", "internshipFilters.payDesc"],
];


export const getInternshipDisciplines = (list) =>
    [...new Set((list ?? []).map((i) => i.discipline).filter(Boolean))].sort();



export function filterInternships(list, {
    search = "", status = ALL, discipline = "ALL", applied = ALL, appliedIds = null
} = {}) {
    return list.filter((i) => {
        if (!matchesColor(colorOf(i.status), status)) return false;
        if (discipline !== "ALL" && i.discipline !== discipline) return false;
        if (appliedIds && applied !== ALL && appliedIds.has(i.id) !== (applied === COLOR.GREEN)) return false;
        return matchesSearch([i.title, i.description, i.requiredSkills, i.location, i.employerEmail], search);
    });
}



export function sortInternships(list, sort = "NEWEST", statusRanks = INTERNSHIP_STATUS_RANK) {
    return [...list].sort(
        byStatusThen(INTERNSHIP_SORTERS[sort] ?? INTERNSHIP_SORTERS.NEWEST, statusRanks));
}

export function applyInternshipFilters(list, {
    search, status, discipline, sort, applied, appliedIds, statusRanks
} = {}) {
    if (!list) return null;
    return sortInternships(
        filterInternships(list, {search, status, discipline, applied, appliedIds}), sort, statusRanks);
}



export function useInternshipFilters(list, appliedIds = null, statusRanks = INTERNSHIP_STATUS_RANK) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useColorFilter("status");
    const [discipline, setDiscipline] = useState("ALL");
    const [applied, setApplied] = useColorFilter("applied", APPLIED_COLORS);
    const [sort, setSort] = useState("NEWEST");

    const disciplines = useMemo(() => getInternshipDisciplines(list), [list]);
    const visible = useMemo(
        () => applyInternshipFilters(list, {search, status, discipline, sort, applied, appliedIds, statusRanks}),
        [list, search, status, discipline, sort, applied, appliedIds, statusRanks],
    );

    return {
        search, setSearch, status, setStatus, discipline, setDiscipline, sort, setSort,
        applied, setApplied,
        disciplines, visible,
        filtersActive: search.trim() !== "" || status !== ALL || discipline !== "ALL" || applied !== ALL,
    };
}



const compareStudentName = (a, b) =>
    (a.student?.lastName ?? "").localeCompare(b.student?.lastName ?? "") ||
    (a.student?.firstName ?? "").localeCompare(b.student?.firstName ?? "");

export const CV_SORTERS = {
    DATE_DESC: reverse(compareTimestamp("uploadedAt")),
    DATE_ASC: compareTimestamp("uploadedAt"),
    NAME_ASC: compareStudentName,
    NAME_DESC: reverse(compareStudentName),
};


export const CV_SORT_OPTIONS = [
    ["DATE_DESC", "cvDocuments.sortNewest"],
    ["DATE_ASC", "cvDocuments.sortOldest"],
    ["NAME_ASC", "cvDocuments.sortNameAsc"],
    ["NAME_DESC", "cvDocuments.sortNameDesc"],
];


export const sortCvsNewest = (list) => [...list].sort(byStatusThen(CV_SORTERS.DATE_DESC));


export const getCvDisciplines = (docs) =>
    [...new Set((docs ?? []).map((d) => d.student?.discipline).filter(Boolean))].sort();

export function filterCvs(docs, {status = ALL, discipline = "ALL", search = ""} = {}) {
    return docs.filter((d) => {
        if (!matchesColor(colorOf(d.status), status)) return false;
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


export function useCvFilters(docs) {
    const [status, setStatus] = useColorFilter("status");
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



export function filterStudentStatuses(list, {
    search = "",
    accountStatus = ALL,
    internshipStatus = ALL,
    progress = ALL,
} = {}) {
    return list.filter((student) => {
        if (
            accountStatus !== ALL &&
            student.accountStatus !== accountStatus
        ) return false;

        if (
            internshipStatus !== ALL &&
            student.internshipStatus !== internshipStatus
        ) return false;

        if (!matchesColor(studentStatusColor(student), progress)) return false;

        return matchesSearch([student.firstName, student.lastName, student.studentId,], search);
    });
}

export function useStudentStatusFilters(list) {
    const [search, setSearch] = useState("");
    const [accountStatus, setAccountStatus] = useState(ALL);
    const [internshipStatus, setInternshipStatus] = useState(ALL);
    const [progress, setProgress] = useColorFilter("status");

    const visible = useMemo(() => {
        return filterStudentStatuses(list, {
            search,
            accountStatus,
            internshipStatus,
            progress,
        }).sort((a, b) =>
            compareText("lastName")(a, b) ||
            compareText("firstName")(a, b)
        );
    }, [list, search, accountStatus, internshipStatus, progress]);

    return {
        search, setSearch, accountStatus, setAccountStatus, internshipStatus, setInternshipStatus,
        progress, setProgress, visible,
    };
}
