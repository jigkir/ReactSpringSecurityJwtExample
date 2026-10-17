import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import Button from "../../../styles/Button.jsx";
import {applyForInternship} from "../../api/Api.jsx";
import Icon from "../../../styles/Icon.jsx";

function ApplyControls({internshipId, cvs, dark, alreadyApplied}) {
    const {t} = useTranslation();
    const [cvId, setCvId] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | sending | applied | error
    const [errorKey, setErrorKey] = useState(null);

    // Default to the first CV until the student picks another one
    const selectedCvId = cvId || cvs[0]?.id;

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
   useEffect(() => {
       if(alreadyApplied) {
           setStatus("applied");
       }
   })
    if (status === "applied") {
        return (
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${dark ? "text-green-300" : "text-green-700"}`}
                  role="status">
                <Icon name="check_circle" size={18}/>
                {t("studentInternship.applied")}
            </span>
        );
    }

    const handleApply = async () => {
        setStatus("sending");
        setErrorKey(null);
        try {
            await applyForInternship(internshipId, selectedCvId);
            setStatus("applied");
        } catch (err) {
            setErrorKey(err.status === 409
                ? "studentInternship.alreadyApplied"
                : "studentInternship.applyFailed");
            setStatus("error");
        }
    };

    return (
        <>
            {status === "error" && (
                <span className={`text-sm ${dark ? "text-red-300" : "text-red-600"}`} role="alert">
                    {t(errorKey, {
                        defaultValue: errorKey === "studentInternship.alreadyApplied"
                            ? "You already applied to this internship."
                            : "Could not send your application."
                    })}
                </span>
            )}
            <select
                value={selectedCvId}
                onChange={(e) => setCvId(e.target.value)}
                disabled={status === "sending" || status === "applied"}
                className={selectClass}
                aria-label={t("studentInternship.chooseCv")}
            >
                {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>{cv.fileName}</option>
                ))}
            </select>
            <Button tone="success" dark={dark} icon="send"
                    disabled={status === "sending" || status === "applied"}
                    onClick={handleApply}>
                {t("studentInternship.apply")}
            </Button>
        </>
    );
}

export default ApplyControls;