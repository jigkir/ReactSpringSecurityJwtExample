import Button from "../../styles/Button.jsx";

function UserCard({ studentid, firstname, lastname, status, dark, onReactivate, onDeny }) {
    const renderStatusBadge = (st) => {
        const val = (st || "").toLowerCase();

        if (val === "approved") {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
        } else if (val === "rejected") {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
        } else {
            return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
        }
    };

    const val = (status || "").toLowerCase();

    return (
        <div className={`p-4 rounded-lg border ${dark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"} shadow-sm flex items-center justify-between gap-4`}>
            {/* Left: User Info & Status Badge */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={`text-base font-semibold truncate ${dark ? "text-slate-300" : "text-gray-900"}`}>
                        {firstname} {lastname}
                    </h3>
                    {renderStatusBadge(status)}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                    ID: {studentid}
                </p>
            </div>

            {/* Right: Conditional Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {val === "pending" && (
                    <>
                        <Button
                            dark={dark}
                            icon="check"
                            onClick={onReactivate}
                        >
                            Reactivate
                        </Button>
                        <Button
                            dark={dark}
                            icon="close"
                            onClick={onDeny}
                        >
                            Close
                        </Button>
                    </>
                )}

                {val === "rejected" && (
                    <Button
                        dark={dark}
                        icon="check"
                        onClick={onReactivate}
                    >
                        Reactivate
                    </Button>
                )}

                {val === "approved" && (
                    <Button
                        dark={dark}
                        icon="close"
                        onClick={onDeny}
                    >
                        Close
                    </Button>
                )}
            </div>
        </div>
    );
}

export default UserCard;