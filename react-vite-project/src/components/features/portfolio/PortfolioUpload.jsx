


import {useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import Icon from "../../../styles/ui/Icon.jsx";
import {getSelectClass} from "../../../styles/ui/FormControls.jsx";
import {getCvUploadClasses} from "../../../styles/theme/AppStyles.jsx";
import {uploadDocument} from "../../shared/core/api/Api.jsx";
import {ACCEPTED_EXT, bytesToMb, validateFile} from "../../../utils/documents/Documents.js";
import {DOC_TYPE_KEYS, DOC_TYPES, guessDocType} from "../../../utils/documents/DocumentTypes.js";
import {translateWarning} from "../../../utils/forms/CommonFields.jsx";

const canUpload = (item) => item.status === "ready" || item.status === "failed";

function PortfolioUpload({dark, maxBytes, types = DOC_TYPE_KEYS, defaultType, onUploaded, onClose}) {
    const {t} = useTranslation();
    const inputRef = useRef(null);
    const nextKey = useRef(0);
    const [items, setItems] = useState([]);
    const [busy, setBusy] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const u = getCvUploadClasses(dark, isDragging);
    const divider = `border-t pt-3 ${dark ? "border-slate-700" : "border-gray-200"}`;

    const patch = (key, changes) =>
        setItems((prev) => prev.map((i) => (i.key === key ? {...i, ...changes} : i)));


    const initialTypeFor = (fileName) => {
        if (defaultType && defaultType !== "ALL" && types.includes(defaultType)) return defaultType;
        const guess = guessDocType(fileName);
        return types.includes(guess) ? guess : types[0];
    };

    const addFiles = (fileList) => {
        const added = Array.from(fileList ?? []).map((file) => {
            const error = validateFile(file, maxBytes);
            return {
                key: nextKey.current++,
                file,
                type: initialTypeFor(file.name),
                status: error ? "invalid" : "ready",
                error,
            };
        });
        setItems((prev) => [...prev, ...added]);
    };



    const openPicker = () => {
        if (!busy) inputRef.current?.click();
    };

    const onPicked = (e) => {
        addFiles(e.target.files);
        e.target.value = "";
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


        if (!anyFailed && !hasInvalid) onClose?.();
    };

    const selectClass = getSelectClass(dark);

    return (
        <section className={`rounded-xl border p-4 space-y-3 ${
            dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            <input ref={inputRef} type="file" multiple accept={ACCEPTED_EXT} className="sr-only"
                   tabIndex={-1} aria-hidden="true" onChange={onPicked}/>


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

export default PortfolioUpload;
