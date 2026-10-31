import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Icon from "../../styles/Icon.jsx";
import { usePolling } from "../../utils/usePolling.js";
import { checkUserStatus } from "../api/Api.jsx";
import Button from "../../styles/Button.jsx"; // Adjust path if needed

function ExpiredUser({ user }) {
    const navigate = useNavigate();
    // Possible status states: 'PENDING' | 'REJECTED'
    const [status, setStatus] = useState(user?.status || 'PENDING');
    const { dark } = useOutletContext();
    const isLoggedIn = Boolean(user?.isLoggedIn);

    const checkStatus = useCallback(async () => {
        try {
            const res = await checkUserStatus();
            setStatus(res?.status)
            if (res?.status === 'APPROVED') {
                // Access granted -> redirect student to home or dashboard
                navigate('/', { replace: true });
            }
        } catch {
            // Silence network/polling errors during waiting state
        }
    }, [navigate]);

    // Keep polling while logged in and still in PENDING state
    usePolling(checkStatus, status === "PENDING");

    const isPending = status === 'PENDING';

    const formatRole = (role) => {
        if (!role) return 'User';
        const cleanRole = role.replace(/^ROLE_/, '').toLowerCase();
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1);
    };

    const userRole = (user?.role ?? "").replace(/^ROLE_/, "").toLowerCase();

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className={`max-w-md w-full border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-indigo-500 border-indigo-400"} rounded-2xl p-8 text-center shadow-xl backdrop-blur-sm`}>

                {/* Fused Dynamic Icon & Status Pill Badge */}
                <div className="inline-flex items-center justify-center mb-6">
                    <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border transition-colors ${
                        isPending
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                        <span className="relative flex items-center justify-center">
                            <Icon name={isPending ? "alarm" : "error"} size={20} />
                        </span>
                        <span className="text-xs font-medium tracking-wide">
                            {isPending ? "Waiting for supervisor approval" : "Request rejected by supervisor"}
                        </span>
                    </div>
                </div>

                {/* Dynamic Header Title */}
                <h1 className="text-2xl font-bold text-slate-100 mb-2">
                    {isPending ? `${formatRole(user?.role)} Account Expired` : 'Access Request Denied'}
                </h1>

                {/* Dynamic Description & Context */}
                <p className={`${dark ? "text-slate-400" : "text-slate-300"} text-sm mb-8 leading-relaxed`}>
                    {isPending ? (
                        userRole === 'teacher'
                            ? "Your teacher account access is currently pending validation. We’ve notified the academic administration of your sign-in attempt. This page will update automatically once your account is verified."
                            : "Your student account access has expired. We’ve automatically notified your internship supervisor of your sign-in attempt. This page will update automatically once access is renewed."
                    ) : (
                        userRole === 'teacher'
                            ? "Your teacher account validation request has been reviewed and declined by the administration. Please contact your department head for further assistance."
                            : "Your internship supervisor has reviewed and declined your access request. Please contact your program coordinator directly for further assistance."
                    )}
                </p>

                {/* Action Link */}
                <div className="flex justify-center">
                    <Button dark={dark} tone="primary" size="lg" icon="logout" onClick={() => navigate('/logout')} className=" mx-auto">
                        Sign Out
                    </Button>

                </div>

            </div>
        </div>
    );
}

export default ExpiredUser;