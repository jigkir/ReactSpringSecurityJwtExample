import {useRef, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";
import Icon from "../../../styles/Icon.jsx";
import {applyForInternship, updateApplicationCV, uploadDocument} from "../../api/Api.jsx";
import {validateFile} from "../cv/cvUtils.js";

const HTTP_CONFLICT = 409;
const READ_BY_EMPLOYER = "READ";

const SUCCESS_KEY = {
    applied: "studentInternship.applied",
    cvUpdated: "studentInternship.cvUpdated",
};

function ApplyControls({internshipId, cvs, letters = [], dark, application, onChanged, onLettersChanged}) {
    const {t} = useTranslation();
    const fileRef = useRef(null);
    const [cvId, setCvId] = useState(null);
    const [letterId, setLetterId] = useState(null); // "" = no letter
    const [status, setStatus] = useState("idle"); // idle | sending | applied | cvUpdated | error
    const [errorKey, setErrorKey] = useState(null);

    const selectClass = `rounded-lg border px-2 py-1.5 text-sm max-w-[14rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"
    }`;

    if (cvs.length === 0) {
        return (
            <span className={`text-sm ${dark ? "text-slate-400" : "text-gray-500"}`}>
                {t("studentInternship.noApprovedCv")}{" "}
                <Link to="/portfolio" className="text-indigo-500 hover:underline">
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
    const sentLetterId = application?.coverLetter?.id != null ? String(application.coverLetter.id) : "";
    const selectedLetterId = letterId ?? sentLetterId;
    const letterArg = selectedLetterId ? Number(selectedLetterId) : undefined;
    const unchanged = selectedCvId === application?.cv.id && selectedLetterId === sentLetterId;

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

    const resetFeedback = () => {
        setStatus("idle");
        setErrorKey(null);
    };

    const handleApply = () => submit(
        () => applyForInternship(internshipId, selectedCvId, letterArg),
        "applied", "studentInternship.alreadyApplied");

    const handleUpdate = () => submit(
        () => updateApplicationCV(application.id, selectedCvId, letterArg),
        "cvUpdated", "studentInternship.alreadyReadByEmployer");

    // Upload a new cover letter without leaving the page, then select it
    const handleLetterFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (validateFile(file)) {
            setErrorKey("studentInternship.letterInvalid");
            setStatus("error");
            return;
        }
        setStatus("sending");
        setErrorKey(null);
        try {
            await uploadDocument("COVER_LETTER", file);
            const list = (await onLettersChanged?.()) ?? [];
            const newest = list.reduce((a, b) => (b.id > (a?.id ?? -1) ? b : a), null);
            if (newest) setLetterId(String(newest.id));
            setStatus("idle");
        } catch {
            setErrorKey("studentInternship.letterUploadFailed");
            setStatus("error");
        }
    };

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
                onChange={(e) => {
                    setCvId(Number(e.target.value));
                    resetFeedback();
                }}
                disabled={status === "sending"}
                className={selectClass}
                aria-label={t("studentInternship.chooseCv")}
            >
                {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>{cv.fileName}</option>
                ))}
            </select>

            <select
                value={selectedLetterId}
                onChange={(e) => {
                    setLetterId(e.target.value);
                    resetFeedback();
                }}
                disabled={status === "sending"}
                className={selectClass}
                aria-label={t("studentInternship.chooseLetter")}
            >
                <option value="">{t("studentInternship.noLetter")}</option>
                {letters.map((l) => (
                    <option key={l.id} value={l.id}>{l.fileName}</option>
                ))}
            </select>

            <input ref={fileRef} type="file" accept=".pdf" className="sr-only" tabIndex={-1}
                   aria-hidden="true" onChange={handleLetterFile}/>
            <Button tone="accent" lockTone dark={dark} icon="upload_file" disabled={status === "sending"}
                    onClick={() => fileRef.current?.click()}>
                {t("studentInternship.uploadLetter")}
            </Button>

            {application ? (
                <Button tone="success" dark={dark} icon="send"
                        disabled={status === "sending" || unchanged}
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