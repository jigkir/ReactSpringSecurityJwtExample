import {useTranslation} from "react-i18next";
import Button from "../../styles/Button.jsx";

export default function InterviewActions({
    dark, role, isStudentAwaiting, isEmployerEditable, busy, rejecting,
    onAccept, onStartReject, onDeny, onCloseForm, onEdit, onCancel, editing,
}) {
    const {t} = useTranslation();
    if (!role) return null;
    if (role.can.accept && role.can.reject && isStudentAwaiting) {
        return (
            <div className="flex justify-end gap-3 pt-2">
                {rejecting ? (
                    <>
                        <Button dark={dark} tone="danger" icon="check" disabled={busy} onClick={onDeny}>{t("studentInterviews.confirmRejection")}</Button>
                        <Button dark={dark} tone="neutral" icon="close" disabled={busy} onClick={onCloseForm}>{t("studentInterviews.cancel")}</Button>
                    </>
                ) : (
                    <>
                        <Button dark={dark} tone="success" icon="check" disabled={busy} onClick={onAccept}>{t("studentInterviews.accept")}</Button>
                        <Button dark={dark} tone="danger" icon="close" disabled={busy} onClick={onStartReject}>{t("studentInterviews.reject")}</Button>
                    </>
                )}
            </div>
        );
    }
    if (role.can.edit && isEmployerEditable) {
        return (
            <div className="mt-4 flex justify-end gap-2">
                <Button tone={editing ? "danger" : "warning"} dark={dark} icon={editing ? "close" : "edit"}
                        aria-expanded={editing} onClick={onEdit}>
                    {editing ? t("employerInternship.closeInterviewPicker") : t("employerInternship.editInterviewPicker")}
                </Button>
                {role.can.cancel && (
                    <Button tone="danger" dark={dark} icon="close" disabled={busy} onClick={onCancel}>
                        {t("employerInternship.cancelInterview")}
                    </Button>
                )}
            </div>
        );
    }
    return null;
}
