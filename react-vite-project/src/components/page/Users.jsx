import { useEffect, useState, useMemo, useCallback } from "react";
import { getUsers, reactivateUser, denyUser } from "../api/Api.jsx";
import UserCard from "./UserCard.jsx";
import { useOutletContext } from "react-router-dom";
import { usePolling } from "../../utils/usePolling.js";

const getStatusPriority = (status) => {
    const val = (status || "").toLowerCase();
    if (val === "pending") return 1;
    if (val === "rejected") return 2;
    if (val === "approved") return 3;
    return 4;
};

function Users({ user }) {
    const [users, setUsers] = useState([]);
    const isLoggedIn = Boolean(user?.isLoggedIn);
    const { dark } = useOutletContext();

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
        // Optimistic UI update
        setUsers((prev) =>
            prev.map((u) => (u.studentId === studentId || u.id === studentId ? { ...u, status: "APPROVED" } : u))
        );
        try {
            await reactivateUser(studentId);
        } catch (err) {
            console.error("Failed to reactivate user:", err);
            void load(); // Revert on failure
        }
    };

    const handleDeny = async (studentId) => {
        // Optimistic UI update
        setUsers((prev) =>
            prev.map((u) => (u.studentId === studentId || u.id === studentId ? { ...u, status: "REJECTED" } : u))
        );
        try {
            await denyUser(studentId);
        } catch (err) {
            console.error("Failed to deny user:", err);
            void load(); // Revert on failure
        }
    };

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            return getStatusPriority(a.status) - getStatusPriority(b.status);
        });
    }, [users]);

    return (
        <div className="mt-3 space-y-3">
            {sortedUsers.map((u) => {
                return (
                    <UserCard
                        key={u.id}
                        firstname={u.firstName}
                        lastname={u.lastName}
                        studentid={u.studentId}
                        status={u.status}
                        dark={dark}
                        onReactivate={() => handleReactivate(u.id)}
                        onDeny={() => handleDeny(u.id)}
                    />
                );
            })}
        </div>
    );
}

export default Users;