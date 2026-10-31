/**
 * PortfolioUpload.jsx — Upload several PDFs at once, each with its own document type.
 * The type is guessed from the file name and can be changed before uploading.
 */

import {useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import Icon from '../../../styles/Icon.jsx';
import {uploadDocument} from '../../api/Api.jsx';
import {ACCEPTED_EXT, validateFile} from '../cv/cvUtils.js';
import {DOC_TYPE_KEYS, DOC_TYPES, guessDocType} from '../../../utils/DocumentTypes.js';
import {translateWarning} from '../../../utils/CommonFields.jsx';

let nextKey = 0;

// An item can be sent when it is "ready", or when a previous upload failed on the server side
const isPending = (i) => i.status === "ready" || (i.status === "error" && !i.invalid);

export default function PortfolioUpload({dark, maxBytes, onUploaded, onClose}) {
    const {t} = useTranslation();
    const inputRef = useRef(null);
    const [items, setItems] = useState([]); // {key, file, type, status, error, invalid}
    const [busy, setBusy] = useState(false);

    const patch = (key, changes) =>
        setItems((prev) => prev.map((i) => (i.key === key ? {...i, ...changes} : i)));

    const addFiles = (fileList) => {
        const added = Array.from(fileList ?? []).map((file) => {
            const error = validateFile(file, maxBytes);
            return {
                key: nextKey++,
                file,
                type: guessDocType(file.name),
                status: error ? "error" : "ready",
                error,
                invalid: Boolean(error),
            };
        });
        setItems((prev) => [...prev, ...added]);
        if (inputRef.current) inputRef.current.value = "";
    };

    const pending = items.filter(isPending);

    const uploadAll = async () => {
        setBusy(true);
        for (const item of pending) {
            patch(item.key, {status: "uploading", error: null});
            try {
                await uploadDocument(item.type, item.file);
                patch(item.key, {status: "done"});
            } catch (err) {
                patch(item.key, {status: "error", error: err.i18n ?? {key: "cv.uploadFailed"}});
            }
        }
        setBusy(false);
        onUploaded?.();
    };

    const selectClass = `rounded-lg border px-2 py-1.5 text-sm ${
        dark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;
    const muted = dark ? "text-slate-400" : "text-gray-500";

    return (
        <section className={`rounded-xl border p-4 space-y-3 ${
            dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            <input ref={inputRef} type="file" multiple accept={ACCEPTED_EXT} className="sr-only"
                   tabIndex={-1} aria-hidden="true" onChange={(e) => addFiles(e.target.files)}/>

            <div className="flex flex-wrap items-center gap-2">
                <Button tone="primary" dark={dark} icon="upload_file" disabled={busy}
                        onClick={() => inputRef.current?.click()}>
                    {t("portfolio.chooseFiles")}
                </Button>
                <span className={`text-sm ${muted}`}>{t("portfolio.multiHint")}</span>
                <Button tone="ghost" dark={dark} icon="close" onClick={onClose} className="ml-auto">
                    {t("portfolio.close")}
                </Button>
            </div>

            {items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((i) => (
                        <li key={i.key} className="flex flex-wrap items-center gap-2">
                            <Icon name="picture_as_pdf" size={20}/>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.file.name}</span>
                            <select value={i.type} disabled={busy || i.status === "done"}
                                    onChange={(e) => patch(i.key, {type: e.target.value})}
                                    className={selectClass} aria-label={t("portfolio.typeAria")}>
                                {DOC_TYPE_KEYS.map((k) => (
                                    <option key={k} value={k}>{t(DOC_TYPES[k].labelKey)}</option>
                                ))}
                            </select>
                            {i.status === "uploading" &&
                                <Icon name="progress_activity" size={18} className="animate-spin"/>}
                            {i.status === "done" &&
                                <Icon name="check_circle" size={18} className="text-green-500"/>}
                            {i.status === "error" && i.error && (
                                <span className="text-xs text-red-500" role="alert">
                                    {translateWarning(t, i.error)}
                                </span>
                            )}
                            {i.status !== "uploading" && i.status !== "done" && (
                                <button type="button" aria-label={t("portfolio.removeAria")}
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
                <Button tone="success" icon="send" dark={dark} disabled={busy} onClick={uploadAll}>
                    {t("portfolio.uploadN", {count: pending.length})}
                </Button>
            )}
        </section>
    );
}