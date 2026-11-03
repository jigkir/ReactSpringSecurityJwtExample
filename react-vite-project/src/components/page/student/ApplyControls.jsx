import {useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";
import Icon from "../../../styles/Icon.jsx";
import PortfolioPanel from "../portfolio/PortfolioPanel.jsx";
import {applyForInternship, updateApplicationCV} from "../../api/Api.jsx";
import SentDocuments from "./SentDocuments.jsx";

const HTTP_CONFLICT = 409;
const READ_BY_EMPLOYER = "READ";

const UPLOAD_TYPES = ["COVER_LETTER", "TRANSCRIPT"];

const SUCCESS_KEY = {
    applied: "studentInternship.applied",
    cvUpdated: "studentInternship.cvUpdated",
};

const newestOf = (list) => list.reduce((a, b) => (b.id > (a?.id ?? -1) ? b : a), null);
const maxId = (list) => list.reduce((max, d) => Math.max(max, d.id), -1);

function ApplyControls({
                           internshipId, cvs, letters = [], transcripts = [], dark, application,
                           onChanged, onLettersChanged, onTranscriptsChanged
                       }) {
    const {t} = useTranslation();
    const [open, setOpen] = useState(false);
    const [cvId, setCvId] = useState(null);
    const [letterId, setLetterId] = useState(null); // "" = no letter
    const [transcriptId, setTranscriptId] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | sending | applied | cvUpdated | error
    const [errorKey, setErrorKey] = useState(null);

    if (cvs.length === 0) {
        return (
            <span
                role="note"
                className={`inline-flex flex-wrap items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${
                    dark ? "border-red-500 bg-red-900/30 text-red-200" : "border-red-500 bg-red-50 text-red-700"
                }`}>
                <Icon name="error" size={20}/>
                {t("studentInternship.noApprovedCv")}
                <Link to="/portfolio" className="font-bold underline underline-offset-2 hover:opacity-80">
                    {t("studentInternship.goToCv")}
                </Link>
            </span>
        );
    }

    if (application?.internshipApplicationStatus === READ_BY_EMPLOYER) {
        return <SentDocuments application={application} dark={dark}/>;
    }

    // The CV picked by the student, otherwise the CV already sent, otherwise the first approved CV
    const selectedCvId = cvId ?? application?.cv.id ?? cvs[0].id;

    const sentLetterId = application?.coverLetter?.id != null ? String(application.coverLetter.id) : "";
    const selectedLetterId = letterId ?? sentLetterId;
    const letterArg = selectedLetterId ? Number(selectedLetterId) : undefined;

    const sentTranscriptId = application?.academicTranscript?.id != null ? String(application.academicTranscript.id) : "";
    const selectedTranscriptId = transcriptId ?? sentTranscriptId;
    const transcriptArg = selectedTranscriptId ? Number(selectedTranscriptId) : undefined;

    const unchanged = selectedCvId === application?.cv.id
        && selectedLetterId === sentLetterId
        && selectedTranscriptId === sentTranscriptId;
    const sending = status === "sending";

    const resetFeedback = () => {
        setStatus("idle");
        setErrorKey(null);
    };

    const submit = async (send, successStatus, conflictKey) => {
        setStatus("sending");
        setErrorKey(null);
        try {
            await send();
            await onChanged?.();
            setStatus(successStatus);
            setOpen(false);
        } catch (err) {
            setErrorKey(err.status === HTTP_CONFLICT ? conflictKey : "studentInternship.applyFailed");
            setStatus("error");
        }
    };

    const handleSubmit = () => application
        ? submit(() => updateApplicationCV(application.id, selectedCvId, letterArg, transcriptArg),
            "cvUpdated", "studentInternship.alreadyReadByEmployer")
        : submit(() => applyForInternship(internshipId, selectedCvId, letterArg, transcriptArg),
            "applied", "studentInternship.alreadyApplied");

    // After an upload: reload the letters and transcripts, and tick the new ones
    const handleUploaded = async () => {
        const [lettersBefore, transcriptsBefore] = [maxId(letters), maxId(transcripts)];
        const [letterList, transcriptList] = await Promise.all([
            onLettersChanged?.() ?? [],
            onTranscriptsChanged?.() ?? [],
        ]);

        const newestLetter = newestOf(letterList ?? []);
        if (newestLetter && newestLetter.id > lettersBefore) setLetterId(String(newestLetter.id));

        const newestTranscript = newestOf(transcriptList ?? []);
        if (newestTranscript && newestTranscript.id > transcriptsBefore) setTranscriptId(String(newestTranscript.id));
    };

    const messages = (
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
        </>
    );

    if (!open) {
        return (
            <>
                {application && <SentDocuments application={application} dark={dark}/>}
                {messages}
                <Button tone="success" dark={dark} icon="send" onClick={() => {
                    resetFeedback();
                    setOpen(true);
                }}>
                    {t(application ? "studentInternship.updateCV" : "studentInternship.apply")}
                </Button>
            </>
        );
    }

    return (
        <div className="flex w-full flex-col gap-4 text-left">
            {messages}

            {/* The portfolio view, without its title: pick one CV (approved only), and optionally one letter and one transcript */}
            <PortfolioPanel
                dark={dark}
                uploadTypes={UPLOAD_TYPES}
                onUploaded={handleUploaded}
                selection={{
                    cvId: selectedCvId,
                    letterId: selectedLetterId ? Number(selectedLetterId) : null,
                    transcriptId: selectedTranscriptId ? Number(selectedTranscriptId) : null,
                    disabled: sending,
                    onPickCv: (id) => {
                        setCvId(id);
                        resetFeedback();
                    },
                    // Ticking the ticked letter again removes it
                    onPickLetter: (id) => {
                        setLetterId(selectedLetterId === String(id) ? "" : String(id));
                        resetFeedback();
                    },
                    // Ticking the ticked transcript again removes it
                    onPickTranscript: (id) => {
                        setTranscriptId(selectedTranscriptId === String(id) ? "" : String(id));
                        resetFeedback();
                    },
                }}
            />

            <div className="flex flex-wrap items-center justify-end gap-2">
                <Button tone="neutral" dark={dark} icon="close" disabled={sending}
                        onClick={() => setOpen(false)}>
                    {t("cvDocuments.cancelBtn")}
                </Button>
                <Button tone="success" dark={dark} icon="send" disabled={sending || (application && unchanged)}
                        onClick={handleSubmit}>
                    {t(application ? "interview.saveChanges" : "interview.submitBtn")}
                </Button>
            </div>
        </div>
    );
}

export default ApplyControls;