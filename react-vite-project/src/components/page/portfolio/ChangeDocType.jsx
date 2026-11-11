/**
 * ChangeDocType.jsx — "Edit the document" control of one portfolio document.
 *
 * The button opens a MODAL (rendered in a portal on <body>, with a backdrop). The modal is titled
 * "Edit the document" and offers exactly two actions; nothing else on the page can be used
 * while it is open:
 *   - Change the type: send the file to another type (CV / cover letter / transcript)
 *   - Replace file:    upload a new PDF of the SAME type in place of this one
 *
 * Both work the same way: upload the new document, then hide the original.
 * A CV (moved to CV, or replaced) arrives as a new CV waiting for manager approval.
 *
 * Clicking "Replace file" immediately opens the file picker. The <input> lives inside the modal
 * (always mounted while it is open) so the click can open it synchronously
 * (browsers only allow it inside a user click). Picking a valid PDF replaces the file right away.
 *
 * The modal closes with Cancel, Escape, or a click on the backdrop (not while a request runs).
 *
 * Props
 *   type       "CV" | "COVER_LETTER" | "TRANSCRIPT"   current type of the file
 *   id         number                                  id of the file
 *   fileName   string    optional, shown under the title
 *   dark       boolean
 *   open       boolean   the modal is shown
 *   onOpen     function  opens the modal
 *   onClose    function  closes the modal
 *   onChanged  function  called once the file was moved / replaced (parent reloads its lists)
 *   className  string    optional, applied to the trigger button (e.g. "w-full")
 */

import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import {getSelectClass} from '../../../styles/FormControls.jsx';
import {getDocumentFile, getMaxCvSize, hideDocument, uploadDocument} from '../../api/Api.jsx';
import {ACCEPTED_EXT, base64ToFile, bytesToMb, FALLBACK_MAX_BYTES, validateFile} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {translateWarning} from '../../../utils/CommonFields.jsx';

const MODE = {MOVE: "move", REPLACE: "replace"};

function ChangeDocType({type, id, fileName, dark, open, onOpen, onClose, onChanged, className = ""}) {
    const {t} = useTranslation();
    const titleId = useId();
    const options = DOC_TYPE_KEYS.filter((k) => k !== type);
    const inputRef = useRef(null);
    const [mode, setMode] = useState(MODE.MOVE);
    const [target, setTarget] = useState(options[0]);
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const selectClass = `${getSelectClass(dark)} w-full`;

    // Load the size limit as soon as the modal opens, so it is ready when a file is picked
    useEffect(() => {
        if (open) {
            getMaxCvSize().then(setMaxBytes).catch(() => {
            });
        }
    }, [open]);

    const reset = () => {
        setMode(MODE.MOVE);
        setError(null);
    };

    const close = () => {
        if (busy) return;
        reset();
        onClose?.();
    };

    // Escape closes the modal and the page behind it does not scroll
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape" && !busy) {
                setMode(MODE.MOVE);
                setError(null);
                onClose?.();
            }
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKey);
        };
    }, [open, busy, onClose]);

    const openPicker = () => inputRef.current?.click();

    const switchMode = (next) => {
        if (busy) return;
        setMode(next);
        setError(null);
        // Open the file dialog right away (must run synchronously inside the click)
        if (next === MODE.REPLACE) openPicker();
    };

    const onPicked = async (e) => {
        const picked = e.target.files?.[0] ?? null;
        e.target.value = ""; // lets the same file be picked again
        if (!picked) return;

        const invalid = validateFile(picked, maxBytes);
        setError(invalid);
        if (invalid) return;

        await confirm(picked);
    };

    const confirm = async (selectedFile = null) => {
        if (mode === MODE.REPLACE && !selectedFile) return;

        setBusy(true);
        setError(null);
        try {
            if (mode === MODE.REPLACE) {
                await uploadDocument(type, selectedFile);
            } else {
                const original = await getDocumentFile(type, id);
                if (!original?.content) throw new Error("missing content");
                await uploadDocument(target, base64ToFile(original.content, original.fileName));
            }
            await hideDocument(type, id);
            reset();
            setBusy(false);
            onClose?.();
            onChanged?.();
        } catch (err) {
            setError(err.i18n ?? {
                key: mode === MODE.REPLACE ? "portfolio.changeType.replaceFailed" : "portfolio.changeType.failed",
            });
            setBusy(false);
        }
    };

    const trigger = (
        <Button tone="warning" dark={dark} icon="edit" className={className} onClick={onOpen}>
            {t("portfolio.changeType.btn")}
        </Button>
    );

    if (!open) return trigger;

    const isReplace = mode === MODE.REPLACE;
    const showCvHint = isReplace ? type === "CV" : target === "CV";
    const muted = dark ? "text-slate-300" : "text-gray-700";

    const modal = (
        <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
            }}
        >
            <div
                role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy}
                className={`w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl border p-6 shadow-2xl ${
                    dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            >
                {/* Always mounted while the modal is open so "Replace file" can open it immediately */}
                <input ref={inputRef} type="file" accept={ACCEPTED_EXT} className="sr-only"
                       tabIndex={-1} aria-hidden="true" onChange={onPicked}/>

                {/* Title: the modal offers two actions on the document */}
                <h2 id={titleId} className="text-xl font-bold">{t("portfolio.changeType.btn")}</h2>
                {fileName && (
                    <p className={`mt-1 truncate text-sm ${dark ? "text-slate-400" : "text-gray-500"}`}
                       title={fileName}>
                        {fileName}
                    </p>
                )}

                {/* The two actions */}
                <div role="group" aria-label={t("portfolio.changeType.modeAria")}
                     className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button lockTone tone="warning" dark={dark} icon="edit" autoFocus
                            disabled={busy}
                            className={`w-full ${!isReplace ? "ring-2 ring-orange-400" : ""}`}
                            aria-pressed={!isReplace}
                            onClick={() => switchMode(MODE.MOVE)}>
                        {t("portfolio.changeType.modeMove")}
                    </Button>
                    <Button lockTone tone="primary" dark={dark} icon="upload_file"
                            disabled={busy}
                            className={`w-full ${isReplace ? "ring-2 ring-indigo-400" : "opacity-80"}`}
                            aria-pressed={isReplace}
                            onClick={() => switchMode(MODE.REPLACE)}>
                        {t("portfolio.changeType.modeReplace")}
                    </Button>
                </div>

                {/* Details of the chosen action */}
                <div className="mt-4 flex flex-col gap-3">
                    {isReplace ? (
                        <span className={`text-sm ${dark ? "text-slate-400" : "text-gray-500"}`}>
                            {t("portfolio.formatHint", {mb: bytesToMb(maxBytes)})}
                        </span>
                    ) : (
                        <>
                            <span className={`text-sm ${muted}`}>{t("portfolio.changeType.ask")}</span>
                            <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={busy}
                                    className={selectClass} aria-label={t("portfolio.changeType.aria")}>
                                {options.map((k) => (
                                    <option key={k} value={k}>{t(DOC_TYPES[k].labelKey)}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {showCvHint && (
                        <span className={`text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}>
                            {t("portfolio.changeType.cvHint")}
                        </span>
                    )}
                    {error && (
                        <span className="text-xs text-red-500" role="alert">{translateWarning(t, error)}</span>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <Button tone="neutral" dark={dark} icon="close" disabled={busy} onClick={close}>
                        {t("cvDocuments.cancelBtn")}
                    </Button>
                    {!isReplace && (
                        <Button tone="success" dark={dark} icon="check_circle" disabled={busy}
                                onClick={() => confirm()}>
                            {t("cvDocuments.confirmBtn")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {trigger}
            {createPortal(modal, document.body)}
        </>
    );
}

export default ChangeDocType;