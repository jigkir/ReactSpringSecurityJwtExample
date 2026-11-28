import {useTranslation} from "react-i18next";
import Icon from "../../styles/Icon.jsx";
import {getCvDocumentsClasses, getStatusBorder} from "../../styles/AppStyles.jsx";
import {ALL, borderStatusOf} from "../../utils/StatusColor.js";

const ACCOUNT_TONES = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    INACTIVE: "NEUTRAL",
};

const INTERNSHIP_TONES = {
    NO_CV: "REJECTED",
    CV_PENDING: "PENDING",
    CV_REJECTED: "REJECTED",
    NO_APPLICATION: "REJECTED",
    NO_INTERVIEW: "REJECTED",
    UPCOMING_INTERVIEW: "PENDING",
    AWAITING_DECISION: "PENDING",
    OFFER_PENDING: "PENDING",
    CONTRACT_PENDING: "PENDING",
    CONTRACT_SIGNED: "APPROVED",
};

const STATUS_ICONS = {
    APPROVED: "check_circle",
    REJECTED: "close",
    PENDING: "schedule",
    NEUTRAL: "block",
};

function StatusPill({label, tone, dark}) {
    const s = getCvDocumentsClasses(dark);
    const status = tone ?? "NEUTRAL";

    const pillClass = status === "NEUTRAL"
        ? s.pillPrivate
        : s.statusPill(status);

    return (
        <span className={`${s.pillBase} ${pillClass} gap-1`}>
            <Icon
                name={STATUS_ICONS[status]}
                size={14}
                className="shrink-0"
            />
            <span className="wrap-break-word">
                {label}
            </span>
        </span>
    );
}

function StudentStatusCard({student, dark, filterColor = ALL}) {
    const {t} = useTranslation();
    const s = getCvDocumentsClasses(dark);

    // The card only gets a colored border while a progress color is selected in the filter
    const statusBorder = getStatusBorder(borderStatusOf(filterColor), dark);
    const cardBorder = statusBorder
        ? `border-2 ${statusBorder}`
        : `border ${dark ? "border-slate-700" : "border-gray-200"}`;

    return (
        <div className={`w-full rounded-xl shadow-sm p-4 space-y-3 ${cardBorder} ${
            dark ? "bg-slate-800" : "bg-white"}`}>
            <div>
                <h3 className={s.title}>
                    {student.firstName} {student.lastName}
                </h3>

                <p className={s.meta}>
                    {t("users.studentId", {
                        studentId: student.studentId
                    })}
                </p>
            </div>

            <div className={`border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                dark ? "border-slate-700" : "border-gray-200"
            }`}>
                <div className="space-y-1">
                    <p className={s.meta}>
                        {t("studentStatuses.account")}
                    </p>

                    <StatusPill
                        dark={dark}
                        tone={ACCOUNT_TONES[student.accountStatus]}
                        label={t(
                            `studentStatuses.accountStatuses.${student.accountStatus}`,
                            {defaultValue: t("studentStatuses.unknown")}
                        )}
                    />
                </div>

                <div className="space-y-1">
                    <p className={s.meta}>
                        {t("studentStatuses.internship")}
                    </p>

                    <StatusPill
                        dark={dark}
                        tone={INTERNSHIP_TONES[student.internshipStatus]}
                        label={t(
                            `studentStatuses.internshipStatuses.${student.internshipStatus}`,
                            {defaultValue: t("studentStatuses.unknown")}
                        )}
                    />
                </div>
            </div>
        </div>
    );
}

export default StudentStatusCard;