import {Navigate, useNavigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import Icon from "../../styles/Icon.jsx";
import Button from "../../styles/Button.jsx";
import {ACCOUNT_STATUS} from "../../utils/AccountStatus.js";

function ExpiredUser({user}) {
    const navigate = useNavigate();
    const {t} = useTranslation();
    // App keeps polling the status, so this page updates by itself
    const {dark, accountStatus} = useOutletContext();

    if (!localStorage.getItem("token")) return <Navigate to="/login" replace/>;
    if (accountStatus === null) return <div aria-busy="true"/>;
    if (accountStatus === ACCOUNT_STATUS.APPROVED) return <Navigate to="/home" replace/>;

    const isPending = accountStatus === ACCOUNT_STATUS.PENDING;

    const userRole = (user?.role ?? "").toString().replace(/^ROLE_/, "").toLowerCase();
    const isTeacher = userRole === "teacher";

    // Role label from the navbar keys; falls back to a generic label for unknown roles
    const roleLabel = userRole
        ? t(`navbar.${userRole}`, {defaultValue: userRole.charAt(0).toUpperCase() + userRole.slice(1)})
        : t("expiredUser.unknownRole");

    const title = isPending
        ? t("expiredUser.pendingTitle", {role: roleLabel})
        : t("expiredUser.rejectedTitle");

    let description;
    if (isPending) {
        description = t(isTeacher ? "expiredUser.pendingTeacher" : "expiredUser.pendingStudent");
    } else {
        description = t(isTeacher ? "expiredUser.rejectedTeacher" : "expiredUser.rejectedStudent");
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div
                className={`max-w-md w-full border ${dark ? "bg-slate-900/60 border-slate-800" : "bg-indigo-500 border-indigo-400"} rounded-2xl p-8 text-center shadow-xl backdrop-blur-sm`}>

                {/* Fused Dynamic Icon & Status Pill Badge */}
                <div className="inline-flex items-center justify-center mb-6">
                    <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border transition-colors ${
                        isPending
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                        <span className="relative flex items-center justify-center">
                            <Icon name={isPending ? "alarm" : "error"} size={20}/>
                        </span>
                        <span className="text-xs font-medium tracking-wide">
                            {isPending ? t("expiredUser.pendingBadge") : t("expiredUser.rejectedBadge")}
                        </span>
                    </div>
                </div>

                {/* Dynamic Header Title */}
                <h1 className="text-2xl font-bold text-slate-100 mb-2">{title}</h1>

                {/* Dynamic Description & Context */}
                <p className={`${dark ? "text-slate-400" : "text-slate-300"} text-sm mb-8 leading-relaxed`}>
                    {description}
                </p>

                {/* Action Link */}
                <div className="flex justify-center">
                    <Button dark={dark} tone="primary" size="lg" icon="logout" onClick={() => navigate('/logout')}
                            className=" mx-auto">
                        {t("expiredUser.signOut")}
                    </Button>
                </div>

            </div>
        </div>
    );
}

export default ExpiredUser;