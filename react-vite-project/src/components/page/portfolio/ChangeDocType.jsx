/**
 * ChangeDocType.jsx — "Change type" control of one portfolio document.
 * Lets the student move a file to another type (CV / cover letter / transcript).
 * The list only offers the types the file is NOT in already.
 *
 * Moving = upload a copy under the new type, then hide the original.
 * A file moved to "CV" arrives as a new CV waiting for manager approval.
 *
 * Props
 *   type       "CV" | "COVER_LETTER" | "TRANSCRIPT"   current type of the file
 *   id         number                                  id of the file
 *   dark       boolean
 *   open       boolean   the type picker is shown
 *   onOpen     function  opens the picker
 *   onClose    function  closes the picker
 *   onChanged  function  called once the file was moved (parent reloads its lists)
 *   className  string    optional, applied to every button / select (e.g. "w-full")
 */

import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import {getSelectClass} from '../../../styles/FormControls.jsx';
import {getDocumentFile, hideDocument, uploadDocument} from '../../api/Api.jsx';
import {base64ToFile} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {translateWarning} from '../../../utils/CommonFields.jsx';

export default function ChangeDocType({type, id, dark, open, onOpen, onClose, onChanged, className = ""}) {
    const {t} = useTranslation();
    const options = DOC_TYPE_KEYS.filter((k) => k !== type);
    const [target, setTarget] = useState(options[0]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const selectClass = `${getSelectClass(dark)} ${className}`;

    const close = () => {
        setError(null);
        onClose?.();
    };

    const move = async () => {
        setBusy(true);
        setError(null);
        try {
            const file = await getDocumentFile(type, id);
            if (!file?.content) throw new Error("missing content");
            await uploadDocument(target, base64ToFile(file.content, file.fileName));
            await hideDocument(type, id);
            setBusy(false);
            onClose?.();
            onChanged?.();
        } catch (err) {
            setError(err.i18n ?? {key: "portfolio.changeType.failed"});
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

    return (
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
            {target === "CV" && (
                <span className={`text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}>
                    {t("portfolio.changeType.cvHint")}
                </span>
            )}
            {error && (
                <span className="text-xs text-red-500" role="alert">{translateWarning(t, error)}</span>
            )}
            <Button tone="success" dark={dark} icon="check_circle" disabled={busy} className={className}
                    onClick={move}>
                {t("cvDocuments.confirmBtn")}
            </Button>
            <Button tone="neutral" dark={dark} icon="close" disabled={busy} className={className}
                    onClick={close}>
                {t("cvDocuments.cancelBtn")}
            </Button>
        </>
    );
}