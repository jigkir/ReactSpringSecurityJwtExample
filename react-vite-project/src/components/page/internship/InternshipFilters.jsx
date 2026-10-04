import {useTranslation} from 'react-i18next';
import Icon from '../../../styles/Icon.jsx';
import {INTERNSHIP_SORT_OPTIONS, useInternshipFilters} from '../../../utils/Sort.jsx';

export {useInternshipFilters};

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
                {INTERNSHIP_SORT_OPTIONS.map(([value, key]) => (
                    <option key={value} value={value}>{t(key)}</option>
                ))}
            </select>
        </div>
    );
}