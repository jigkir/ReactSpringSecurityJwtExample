import {useEffect, useState, useMemo, useCallback} from "react";
import {useTranslation} from "react-i18next";
import {getUsers, reactivateUser, denyUser} from "../../shared/core/api/Api.jsx";
import UserCard from "./UserCard.jsx";
import {useOutletContext} from "react-router-dom";
import {usePolling} from "../../../utils/hooks/usePolling.js";
import {getPostInternshipClasses} from "../../../styles/theme/AppStyles.jsx";
import {StatusColorSelect, useColorFilter} from "../../../utils/sorting/Sort.jsx";
import {colorOf, matchesColor} from "../../../utils/status/StatusColor.js";

const normalizeStatus = (status) => String(status ?? "").toUpperCase();

const getStatusPriority = (status) => {
    const val = (status || "").toLowerCase();
    if (val === "pending") return 1;
    if (val === "rejected") return 2;
    if (val === "approved") return 3;
    return 4;
};

function Users({user}) {
    const {t} = useTranslation();
    const [users, setUsers] = useState([]);

    const [status, setStatus] = useColorFilter("status");
    const isLoggedIn = Boolean(user?.isLoggedIn);
    const {dark} = useOutletContext();
    const s = getPostInternshipClasses(dark);

    const load = useCallback(async () => {
        try {
            const data = await getUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setUsers([]);
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) void load();
    }, [isLoggedIn, load]);

    usePolling(load, isLoggedIn);

    const handleReactivate = async (studentId) => {

        setUsers((prev) =>
            prev.map((u) => (u.studentId === studentId || u.id === studentId ? {...u, status: "APPROVED"} : u))
        );
        try {
            await reactivateUser(studentId);
        } catch (err) {
            console.error("Failed to reactivate user:", err);
            void load();
        }
    };

    const handleDeny = async (studentId) => {

        setUsers((prev) =>
            prev.map((u) => (u.studentId === studentId || u.id === studentId ? {...u, status: "REJECTED"} : u))
        );
        try {
            await denyUser(studentId);
        } catch (err) {
            console.error("Failed to deny user:", err);
            void load();
        }
    };

    const sortedUsers = useMemo(() => {
        return [...users]
            .filter((u) => matchesColor(colorOf(normalizeStatus(u.status)), status))
            .sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status));
    }, [users, status]);

    return (
        <div className={s.page}>
            <div className={`${s.listSection} space-y-3`}>
                <div className="flex justify-start">
                    <StatusColorSelect
                        dark={dark}
                        page="managerUsers"
                        value={status}
                        onChange={setStatus}
                        ariaLabel={t("internshipFilters.allStatuses")}
                    />
                </div>
                {sortedUsers.map((u) => (
                    <UserCard
                        key={u.id}
                        firstname={u.firstName}
                        lastname={u.lastName}
                        studentid={u.studentId}
                        status={u.status}
                        dark={dark}
                        filterColor={status}
                        onReactivate={() => handleReactivate(u.id)}
                        onDeny={() => handleDeny(u.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default Users;
