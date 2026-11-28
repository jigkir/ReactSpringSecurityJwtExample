import {useTranslation} from "react-i18next";
import {useOutletContext} from "react-router-dom";
import {getPostInternshipClasses} from "../../styles/AppStyles.jsx";
import {StatusColorSelect, useStudentStatusFilters} from "../../utils/Sort.jsx";
import {ALL} from "../../utils/StatusColor.js";
import StudentStatusCard from "./StudentStatusCard.jsx";
import {ACCOUNT_STATUSES, INTERNSHIP_STATUSES, MOCK_STUDENTS} from "./StudentStatusMock.js";

function StudentStatuses() {
    const {t} = useTranslation();
    const {dark} = useOutletContext();

    const s = getPostInternshipClasses(dark);

    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
        dark
            ? "bg-slate-800 border-slate-600 text-white"
            : "bg-white border-slate-300 text-slate-900"
    }`;

    // Temporary data until the backend is implemented.
    const students = MOCK_STUDENTS;

    const {
        search,
        setSearch,
        accountStatus,
        setAccountStatus,
        internshipStatus,
        setInternshipStatus,
        progress,
        setProgress,
        visible,
    } = useStudentStatusFilters(students);

    return (
        <div className={s.page}>
            <div className={s.listSection}>

                {/* Filters */}
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                        <label
                            htmlFor="student-search"
                            className="mb-1 block text-sm font-medium"
                        >
                            {t("studentStatuses.search")}
                        </label>
                        <input
                            id="student-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("studentStatuses.searchPlaceholder")}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="account-status"
                            className="mb-1 block text-sm font-medium"
                        >
                            {t("studentStatuses.account")}
                        </label>
                        <select
                            id="account-status"
                            value={accountStatus}
                            onChange={(e) => setAccountStatus(e.target.value)}
                            className={inputClass}
                        >
                            <option value={ALL}>
                                {t("internshipFilters.allStatuses")}
                            </option>

                            {ACCOUNT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {t(`studentStatuses.accountStatuses.${status}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="internship-status"
                            className="mb-1 block text-sm font-medium"
                        >
                            {t("studentStatuses.internship")}
                        </label>
                        <select
                            id="internship-status"
                            value={internshipStatus}
                            onChange={(e) => setInternshipStatus(e.target.value)}
                            className={inputClass}
                        >
                            <option value={ALL}>
                                {t("internshipFilters.allStatuses")}
                            </option>

                            {INTERNSHIP_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {t(`studentStatuses.internshipStatuses.${status}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="student-progress"
                            className="mb-1 block text-sm font-medium"
                        >
                            {t("studentStatuses.progressLabel")}
                        </label>
                        <StatusColorSelect
                            id="student-progress"
                            dark={dark}
                            value={progress}
                            onChange={setProgress}
                            page="managerStudentStatuses"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Student count */}
                <p className={`${s.subtitle} mb-3`}>
                    {t("studentStatuses.count", {
                        count: visible.length
                    })}
                </p>

                {/* Student list */}
                <div className={s.scrollArea}>
                    {visible.length === 0 ? (
                        <p className={s.emptyText}>
                            {t("studentStatuses.empty")}
                        </p>
                    ) : (
                        visible.map((student) => (
                            <StudentStatusCard
                                key={student.id}
                                student={student}
                                dark={dark}
                                filterColor={progress}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentStatuses;