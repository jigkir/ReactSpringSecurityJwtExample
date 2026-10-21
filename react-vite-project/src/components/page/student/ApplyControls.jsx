import {useTranslation} from "react-i18next";
import {useState} from "react";
import {Link} from "react-router-dom";
import Button from "../../../styles/Button.jsx";
import {applyForInternship, updateApplicationCV} from "../../api/Api.jsx";
import Icon from "../../../styles/Icon.jsx";

const HTTP_CONFLICT = 409;
const READ_BY_EMPLOYER = "READ";

const SUCCESS_KEY = {
    applied: "studentInternship.applied",
    cvUpdated: "studentInternship.cvUpdated",
};

function ApplyControls({internshipId, cvs, dark, application, onChanged}) {
    const {t} = useTranslation();
    const [cvId, setCvId] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | sending | applied | cvUpdated | error
    const [errorKey, setErrorKey] = useState(null);

    const selectClass = `rounded-lg border px-2 py-1.5 text-sm max-w-[14rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"
    }`;

    if (cvs.length === 0) {
        return (
            <span className={`text-sm ${dark ? "text-slate-400" : "text-gray-500"}`}>
                {t("studentInternship.noApprovedCv")}{" "}
                <Link to="/cv" className="text-indigo-500 hover:underline">
                    {t("studentInternship.goToCv")}
                </Link>
            </span>
        );
    }

    if (application?.internshipApplicationStatus === READ_BY_EMPLOYER) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${dark ? "text-green-300" : "text-green-700"}`}
                role="status">
                <Icon name="check_circle" size={18}/>
                {t("studentInternship.applied")}
            </span>
        );
    }

    // The CV picked by the student, otherwise the CV already sent, otherwise the first approved CV
    const selectedCvId = cvId ?? application?.cv.id ?? cvs[0].id;
    const isSentCvSelected = selectedCvId === application?.cv.id;

    const submit = async (send, successStatus, conflictKey) => {
        setStatus("sending");
        setErrorKey(null);
        try {
            await send();
            await onChanged?.();
            setStatus(successStatus);
        } catch (err) {
            setErrorKey(err.status === HTTP_CONFLICT ? conflictKey : "studentInternship.applyFailed");
            setStatus("error");
        }
    };

    const handleCvChange = (e) => {
        setCvId(Number(e.target.value));
        setStatus("idle");
        setErrorKey(null);
    };

    const handleApply = () => submit(
        () => applyForInternship(internshipId, selectedCvId), "applied", "studentInternship.alreadyApplied");

    const handleUpdate = () => submit(
        () => updateApplicationCV(application.id, selectedCvId), "cvUpdated", "studentInternship.alreadyReadByEmployer");

    return (
        <>
            {status === "error" && (
                <span className={`text-sm ${dark ? "text-red-300" : "text-red-600"}`} role="alert">
                    {t(errorKey)}
                </span>
            )}
            {SUCCESS_KEY[status] && (
                <span className={`text-sm ${dark ? "text-green-300" : "text-green-700"}`} role="status">
                    {t(SUCCESS_KEY[status])}
                </span>
            )}
            <select
                value={selectedCvId}
                onChange={handleCvChange}
                disabled={status === "sending"}
                className={selectClass}
                aria-label={t("studentInternship.chooseCv")}
            >
                {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>{cv.fileName}</option>
                ))}
            </select>
            {application ? (
                <Button tone="success" dark={dark} icon="send"
                        disabled={status === "sending" || isSentCvSelected}
                        onClick={handleUpdate}>
                    {t("studentInternship.updateCV")}
                </Button>
            ) : (
                <Button tone="success" dark={dark} icon="send"
                        disabled={status === "sending" || status === "applied"}
                        onClick={handleApply}>
                    {t("studentInternship.apply")}
                </Button>
            )}
        </>
    );
}

export default ApplyControls;