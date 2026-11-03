import {useTranslation} from "react-i18next";
import Button from "../../styles/Button.jsx";

const STATUS_BADGE = {
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
};

function UserCard({ studentid, firstname, lastname, status, dark, onReactivate, onDeny }) {
    const {t} = useTranslation();
    const val = (status || "").toLowerCase();
    const badgeKey = val === "approved" || val === "rejected" ? val : "pending";

    return (
        <div className={`p-4 rounded-lg border ${dark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"} shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}>
            {/* Left: User Info & Status Badge */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-base font-semibold truncate ${dark ? "text-slate-300" : "text-gray-900"}`}>
                        {firstname} {lastname}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[badgeKey]}`}>
                        {t(`users.statuses.${badgeKey}`)}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                    {t("users.studentId", {studentId: studentid})}
                </p>
            </div>

            {/* Right: Conditional Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
                {val === "pending" && (
                    <>
                        <Button dark={dark} icon="check" onClick={onReactivate}>
                            {t("users.reactivate")}
                        </Button>
                        <Button dark={dark} icon="close" onClick={onDeny}>
                            {t("users.close")}
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
                        {t("users.close")}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default UserCard;