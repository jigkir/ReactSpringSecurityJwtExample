/**
 * PortfolioUpload.jsx — Upload several PDFs at once, each with its own document type.
 * Files are added by drag & drop or with the file picker (click / Enter / Space on the dropzone).
 * The type is guessed from the file name and can be changed before uploading.
 *
 * Item status: ready → uploading → done | failed (server error, can be retried)
 *              invalid (rejected by validateFile, never sent; remove it)
 *
 * Props
 *   dark        boolean
 *   maxBytes    number    max size of one file
 *   types       string[]  optional, document types offered (default: all). The guessed type
 *                         falls back to the first one when it is not allowed.
 *   onUploaded  function  called after every upload attempt (parent reloads its lists)
 *   onClose     function  called when everything was uploaded, or when the Close button is clicked
 */

import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import Icon from '../../../styles/Icon.jsx';
import {getSelectClass} from '../../../styles/FormControls.jsx';
import {getCvUploadClasses} from '../../../styles/AppStyles.jsx';
import {uploadDocument} from '../../api/Api.jsx';
import {ACCEPTED_EXT, bytesToMb, validateFile} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES, guessDocType} from '../../../utils/DocumentTypes.js';
import {translateWarning} from '../../../utils/CommonFields.jsx';

const canUpload = (item) => item.status === "ready" || item.status === "failed";

export default function PortfolioUpload({dark, maxBytes, types = DOC_TYPE_KEYS, onUploaded, onClose}) {
    const {t} = useTranslation();
    const inputRef = useRef(null);
    const nextKey = useRef(0);
    const [items, setItems] = useState([]); // {key, file, type, status, error}
    const [busy, setBusy] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const u = getCvUploadClasses(dark, isDragging);
    const divider = `border-t pt-3 ${dark ? "border-slate-700" : "border-gray-200"}`;

    const patch = (key, changes) =>
        setItems((prev) => prev.map((i) => (i.key === key ? {...i, ...changes} : i)));

    const addFiles = (fileList) => {
        const added = Array.from(fileList ?? []).map((file) => {
            const error = validateFile(file, maxBytes);
            const guess = guessDocType(file.name);
            return {
                key: nextKey.current++,
                file,
                type: types.includes(guess) ? guess : types[0],
                status: error ? "invalid" : "ready",
                error,
            };
        });
        setItems((prev) => [...prev, ...added]);
    };

    // ── Picker + drag & drop ──────────────────────────────────────────────────

    const openPicker = () => {
        if (!busy) inputRef.current?.click();
    };

    const onPicked = (e) => {
        addFiles(e.target.files);
        e.target.value = ""; // lets the same file be picked again
    };

    const onDragOver = (e) => {
        e.preventDefault();
        if (!busy) setIsDragging(true);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!busy) addFiles(e.dataTransfer.files);
    };

    // ── Upload ────────────────────────────────────────────────────────────────

    const pending = items.filter(canUpload);
    const hasInvalid = items.some((i) => i.status === "invalid");

    const uploadAll = async () => {
        setBusy(true);
        let anyFailed = false;

        for (const item of pending) {
            patch(item.key, {status: "uploading", error: null});
            try {
                await uploadDocument(item.type, item.file);
                patch(item.key, {status: "done"});
            } catch (err) {
                anyFailed = true;
                patch(item.key, {status: "failed", error: err.i18n ?? {key: "portfolio.uploadFailed"}});
            }
        }

        setBusy(false);
        onUploaded?.();

        // Stay open while something still needs the student's attention
        if (!anyFailed && !hasInvalid) onClose?.();
    };

    const selectClass = getSelectClass(dark);

    return (
        <section className={`rounded-xl border p-4 space-y-3 ${
            dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            <input ref={inputRef} type="file" multiple accept={ACCEPTED_EXT} className="sr-only"
                   tabIndex={-1} aria-hidden="true" onChange={onPicked}/>

            {/* Dropzone */}
            <div
                className={u.dropzone}
                role="button" tabIndex={0} aria-disabled={busy} aria-label={t("portfolio.dropzoneAria")}
                onClick={openPicker}
                onDragOver={onDragOver} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPicker();
                    }
                }}
            >
                <Icon name="upload_file" size={40} className={isDragging ? "text-indigo-500" : u.iconColor}/>
                <div>
                    <p className={u.dragHintText}>
                        {t("portfolio.dropHint")}{" "}
                        <span className="text-indigo-500 underline underline-offset-2">{t("portfolio.browse")}</span>
                    </p>
                    <p className={u.hint}>{t("portfolio.multiHint")}</p>
                    <p className={u.hint}>{t("portfolio.formatHint", {mb: bytesToMb(maxBytes)})}</p>
                </div>
            </div>

            {/* Selected files */}
            {items.length > 0 && (
                <ul className={`space-y-2 ${divider}`}>
                    {items.map((i) => (
                        <li key={i.key} className="flex flex-wrap items-center gap-2">
                            <Icon name="picture_as_pdf" size={20}/>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.file.name}</span>
                            <select value={i.type} disabled={busy || i.status === "done" || i.status === "invalid"}
                                    onChange={(e) => patch(i.key, {type: e.target.value})}
                                    className={selectClass} aria-label={t("portfolio.typeAria")}>
                                {types.map((k) => (
                                    <option key={k} value={k}>{t(DOC_TYPES[k].labelKey)}</option>
                                ))}
                            </select>
                            {i.status === "uploading" &&
                                <Icon name="progress_activity" size={18} className="animate-spin"/>}
                            {i.status === "done" &&
                                <Icon name="check_circle" size={18} className="text-green-500"/>}
                            {i.error && (
                                <span className="text-xs text-red-500" role="alert">
                                    {translateWarning(t, i.error)}
                                </span>
                            )}
                            {i.status !== "uploading" && i.status !== "done" && (
                                <button type="button" aria-label={t("portfolio.removeAria")}
                                        disabled={busy}
                                        onClick={() => setItems((p) => p.filter((x) => x.key !== i.key))}
                                        className="text-red-500 hover:text-red-600 flex">
                                    <Icon name="delete" size={18}/>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {pending.length > 0 && (
                <div className={divider}>
                    <Button tone="success" icon="send" dark={dark} disabled={busy} onClick={uploadAll}>
                        {t("portfolio.uploadN", {count: pending.length})}
                    </Button>
                </div>
            )}
        </section>
    );
}
