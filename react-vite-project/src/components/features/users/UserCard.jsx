import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";
import Icon from "../../../styles/Icon.jsx";
import {getCvDocumentsClasses, getStatusBorder} from "../../../styles/AppStyles.jsx";
import {ALL, borderStatusOf} from "../../../utils/StatusColor.js";

const PILL_STATUS = {
    approved: "APPROVED",
    assigned: "APPROVED",
    rejected: "REJECTED",
    pending: "PENDING",
};

const STATUS_ICON = {
    APPROVED: "check_circle",
    REJECTED: "close",
    PENDING: "schedule",
};

function UserCard({
                      studentid, firstname, lastname, status, dark, onReactivate, onDeny, footer,
                      filterColor = ALL
                  }) {
    const {t} = useTranslation();
    const th = getCvDocumentsClasses(dark);
    const val = (status || "").toLowerCase();

    let badgeKey = "pending";
    if (val === "rejected") {
        badgeKey = "rejected";
    } else if (val === "approved") {
        badgeKey = footer ? "assigned" : "approved";
    }

    const pillStatus = PILL_STATUS[badgeKey];

    const statusBorder = getStatusBorder(borderStatusOf(filterColor), dark);
    const cardBorder = statusBorder
        ? `border-2 ${statusBorder}`
        : `border ${dark ? "border-slate-700" : "border-gray-200"}`;

    return (
        <div
            className={`p-4 rounded-lg ${cardBorder} ${dark ? "bg-slate-800" : "bg-white"} shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}>
            {/* Left: User Info & Status Badge */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-base font-semibold truncate ${dark ? "text-slate-300" : "text-gray-900"}`}>
                        {firstname} {lastname}
                    </h3>
                    <span className={`${th.pillBase} ${th.statusPill(pillStatus)} gap-1 text-left`}>
                        <Icon name={STATUS_ICON[pillStatus]} size={14} className="shrink-0"/>
                        <span className="min-w-0 wrap-break-word">
                            {t(`users.statuses.${badgeKey}`)}
                        </span>
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                    {t("users.studentId", {studentId: studentid})}
                </p>
                {footer && (
                    <div className="mt-2">
                        {footer}
                    </div>
                )}
            </div>

            {/* Right: Conditional Action Buttons (hidden when footer is present) */}
            {!footer && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {val === "pending" && (
                        <>
                            <Button dark={dark} icon="check" onClick={onReactivate}>
                                {t("users.reactivate")}
                            </Button>
                            <Button dark={dark} icon="close" onClick={onDeny}>
                                {t("users.deactivate")}
                            </Button>
                        </>
                    )}

                    {val === "rejected" && (
                        <Button dark={dark} icon="check" onClick={onReactivate}>
                            {t("users.reactivate")}
                        </Button>
                    )}

                    {val === "approved" && (
                        <Button dark={dark} icon="close" onClick={onDeny}>
                            {t("users.deactivate")}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export default UserCard;