import {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Icon from '../../../styles/Icon.jsx';

// ── Sorting helpers ──────────────────────────────────────────────────────────

const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const byId = (a, b) => {
    const x = toNum(a.id);
    const y = toNum(b.id);
    return x !== null && y !== null ? x - y : String(a.id).localeCompare(String(b.id));
};

// ISO dates (YYYY-MM-DD) sort correctly as strings
const byDate = (field) => (a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? ""));
const byTitle = (a, b) => (a.title ?? "").localeCompare(b.title ?? "");
const pay = (i) => (i.compensationNegotiable || i.compensationAmount == null ? -1 : Number(i.compensationAmount));

const SORTERS = {
    NEWEST: (a, b) => byId(b, a),
    OLDEST: byId,
    DEADLINE_ASC: byDate("applicationDeadline"),
    START_ASC: byDate("startDate"),
    TITLE_ASC: byTitle,
    TITLE_DESC: (a, b) => byTitle(b, a),
    PAY_DESC: (a, b) => pay(b) - pay(a),
};

// Sort option value -> translation key
const SORT_OPTIONS = [
    ["NEWEST", "internshipFilters.newest"],
    ["OLDEST", "internshipFilters.oldest"],
    ["DEADLINE_ASC", "internshipFilters.deadlineAsc"],
    ["START_ASC", "internshipFilters.startAsc"],
    ["TITLE_ASC", "internshipFilters.titleAsc"],
    ["TITLE_DESC", "internshipFilters.titleDesc"],
    ["PAY_DESC", "internshipFilters.payDesc"],
];

// ── Hook: owns filter state and returns the visible list ─────────────────────

export function useInternshipFilters(list) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [sort, setSort] = useState("NEWEST");

    const visible = useMemo(() => {
        if (!list) return null;
        const q = search.trim().toLowerCase();

        return list
            .filter((i) => {
                if (status !== "ALL" && i.status !== status) return false;
                if (q) {
                    const haystack = [i.title, i.description, i.requiredSkills, i.location]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();
                    if (!haystack.includes(q)) return false;
                }
                return true;
            })
            .sort(SORTERS[sort] ?? SORTERS.NEWEST);
    }, [list, search, status, sort]);

    return {
        search, setSearch, status, setStatus, sort, setSort, visible,
        filtersActive: search.trim() !== "" || status !== "ALL",
    };
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

export default function InternshipFilters({dark, filters, showStatus = true}) {
    const {t} = useTranslation();
    const {search, setSearch, status, setStatus, sort, setSort} = filters;

    const selectClass = `rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative w-full md:w-64">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("internshipFilters.searchPlaceholder")}
                    aria-label={t("internshipFilters.searchAria")}
                    className={`${selectClass} w-full pr-8 [&::-webkit-search-cancel-button]:appearance-none`}
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label={t("internshipFilters.clearSearchAria")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex text-red-500 hover:text-red-600"
                    >
                        <Icon name="close" size={18}/>
                    </button>
                )}
            </div>

            {showStatus && (
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                        className={selectClass} aria-label={t("internshipFilters.statusAria")}>
                    <option value="ALL">{t("internshipFilters.allStatuses")}</option>
                    <option value="PENDING">{t("internshipFilters.pending")}</option>
                    <option value="APPROVED">{t("internshipFilters.approved")}</option>
                    <option value="REJECTED">{t("internshipFilters.rejected")}</option>
                </select>
            )}

            <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className={selectClass} aria-label={t("internshipFilters.sortAria")}>
                {SORT_OPTIONS.map(([value, key]) => (
                    <option key={value} value={value}>{t(key)}</option>
                ))}
            </select>
        </div>
    );
}