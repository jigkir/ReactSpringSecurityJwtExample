import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Icon from "../../styles/Icon.jsx";
import { usePolling } from "../../utils/usePolling.js";
import { checkUserStatus } from "../api/Api.jsx"; // Adjust path if needed

function ExpiredUser({ user }) {
    const navigate = useNavigate();
    // Possible status states: 'PENDING' | 'REJECTED'
    const [status, setStatus] = useState('PENDING');
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

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className={`max-w-md w-full border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-indigo-500 border-indigo-400"} rounded-2xl p-8 text-center shadow-xl backdrop-blur-sm`}>

                {/* Dynamic Icon Header based on Status */}
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6 border transition-colors ${
                    isPending
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    <Icon name={isPending ? "alarm" : "error"} size={28} />
                </div>

                {/* Dynamic Header Title */}
                <h1 className="text-2xl font-bold text-slate-100 mb-2">
                    {isPending ? 'Student Account Expired' : 'Access Request Denied'}
                </h1>

                {/* Dynamic Description & Context */}
                <p className={`${dark ? "text-slate-400" : "text-slate-300"} text-sm mb-6 leading-relaxed`}>
                    {isPending ? (
                        "Your account access has expired. We’ve automatically notified your internship supervisor of your sign-in attempt. This page will update automatically once access is renewed."
                    ) : (
                        "Your internship supervisor has reviewed and declined your access request. Please contact your program coordinator directly for further assistance."
                    )}
                </p>

                {/* Dynamic Status Pill */}
                <div className="inline-flex items-center justify-center mb-8">
                    {isPending ? (
                        <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>Waiting for supervisor approval...</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-800/50 text-red-300 text-xs px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span>Request rejected by supervisor</span>
                        </div>
                    )}
                </div>

                {/* Action Link */}
                <div>
                    <Link
                        to="/logout"
                        className={`w-full py-2.5 px-4 bg-transparent hover:text-slate-200 ${dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-indigo-400 text-slate-300"} font-medium text-sm rounded-xl transition flex items-center justify-center gap-2`}
                    >
                        <Icon name="logout" size={18} />
                        Sign Out / Back to Home
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default ExpiredUser;