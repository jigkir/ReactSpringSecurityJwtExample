/**
 * ChangeDocType.jsx — "Change document" control of one portfolio document.
 * Two actions once opened:
 *   - move:    send the file to another type (CV / cover letter / transcript)
 *   - replace: upload a new PDF of the SAME type in place of this one
 *
 * Both work the same way: upload the new document, then hide the original.
 * A CV (moved to CV, or replaced) arrives as a new CV waiting for manager approval.
 *
 * Clicking "Replace file" immediately opens the file picker. The <input> is always mounted
 * so the click can open it synchronously (browsers only allow it inside a user click).
 *
 * Props
 *   type       "CV" | "COVER_LETTER" | "TRANSCRIPT"   current type of the file
 *   id         number                                  id of the file
 *   dark       boolean
 *   open       boolean   the picker is shown
 *   onOpen     function  opens the picker
 *   onClose    function  closes the picker
 *   onChanged  function  called once the file was moved / replaced (parent reloads its lists)
 *   className  string    optional, applied to every button / select (e.g. "w-full")
 */

import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import {getSelectClass} from '../../../styles/FormControls.jsx';
import {getDocumentFile, getMaxCvSize, hideDocument, uploadDocument} from '../../api/Api.jsx';
import {ACCEPTED_EXT, base64ToFile, FALLBACK_MAX_BYTES, validateFile} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {translateWarning} from '../../../utils/CommonFields.jsx';

const MODE = {MOVE: "move", REPLACE: "replace"};

function ChangeDocType({type, id, dark, open, onOpen, onClose, onChanged, className = ""}) {
    const {t} = useTranslation();
    const options = DOC_TYPE_KEYS.filter((k) => k !== type);
    const inputRef = useRef(null);
    const [mode, setMode] = useState(MODE.MOVE);
    const [target, setTarget] = useState(options[0]);
    const [file, setFile] = useState(null);
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const selectClass = `${getSelectClass(dark)} ${className}`;

    // Load the size limit as soon as the panel opens, so it is ready when a file is picked
    useEffect(() => {
        if (open) {
            getMaxCvSize().then(setMaxBytes).catch(() => {
            });
        }
    }, [open]);

    const reset = () => {
        setMode(MODE.MOVE);
        setFile(null);
        setError(null);
    };

    const close = () => {
        reset();
        onClose?.();
    };

    const openPicker = () => inputRef.current?.click();

    const switchMode = (next) => {
        if (busy) return;
        setMode(next);
        setError(null);
        setFile(null);
        // Open the file dialog right away (must run synchronously inside the click)
        if (next === MODE.REPLACE) openPicker();
    };

    const onPicked = async (e) => {
        const picked = e.target.files?.[0] ?? null;
        e.target.value = ""; // lets the same file be picked again
        if (!picked) return;

        const invalid = validateFile(picked, maxBytes);
        setError(invalid);
        if (invalid) {
            setFile(null);
            return;
        }

        await confirm(picked);
    };

    const confirm = async (selectedFile = file) => {
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

    if (!open) {
        return (
            <Button tone="warning" dark={dark} icon="edit" className={className} onClick={onOpen}>
                {t("portfolio.changeType.btn")}
            </Button>
        );
    }

    const isReplace = mode === MODE.REPLACE;
    const showCvHint = isReplace ? type === "CV" : target === "CV";

    return (
        <>
            {/* Always mounted so "Replace file" can open it immediately */}
            <input ref={inputRef} type="file" accept={ACCEPTED_EXT} className="sr-only"
                   tabIndex={-1} aria-hidden="true" onChange={onPicked}/>

            {/* Choose the action */}
            <div role="group" aria-label={t("portfolio.changeType.modeAria")} className="flex flex-col gap-2">
                {/* "Change type" is always orange; a ring shows when it is the active mode */}
                <Button lockTone tone="warning" dark={dark} icon="edit"
                        disabled={busy}
                        className={`${className} ${!isReplace ? "ring-2 ring-orange-400" : ""}`}
                        aria-pressed={!isReplace}
                        onClick={() => switchMode(MODE.MOVE)}>
                    {t("portfolio.changeType.modeMove")}
                </Button>
                <Button lockTone tone={isReplace ? "primary" : "accent"} dark={dark} icon="upload_file"
                        disabled={busy}
                        className={`${className} !bg-[oklch(51.1%_0.262_276.966)] !border-transparent !text-white hover:!bg-[oklch(46%_0.262_276.966)]`}
                        aria-pressed={isReplace}
                        onClick={() => switchMode(MODE.REPLACE)}>
                    {t("portfolio.changeType.modeReplace")}
                </Button>
            </div>

            {isReplace ? null : (
                <>
                    <span className={`text-sm ${dark ? "text-slate-300" : "text-gray-700"}`}>
                        {t("portfolio.changeType.ask")}
                    </span>
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

            <Button tone="success" dark={dark} icon="check_circle" className={className}
                    disabled={busy || (isReplace && !file)} onClick={confirm}>
                {t("cvDocuments.confirmBtn")}
            </Button>
            <Button tone="neutral" dark={dark} icon="close" disabled={busy} className={className}
                    onClick={close}>
                {t("cvDocuments.cancelBtn")}
            </Button>
        </>
    );
}

export default ChangeDocType;