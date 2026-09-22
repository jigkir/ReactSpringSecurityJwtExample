/**
 * CvUpload.jsx — Pure UI for the CV upload flow.
 *
 * Renders one of five sub-views depending on `uploadState`:
 *   IDLE        → dropzone
 *   FILE_READY  → file preview card + upload button
 *   UPLOADING   → file preview card + spinner
 *   ERROR       → file preview card + retry / cancel
 *   SUCCESS     → success confirmation
 *
 * Stateless — all state lives in Cv.jsx. Receives everything as props.
 */

import {getAuthClasses, getCvUploadClasses} from '../../../../styles/appStyles.jsx';
import {formatBytes} from './cvUtils.js';
import {useTranslation} from 'react-i18next';

const PdfIcon = ({className = "h-10 w-10"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"
         strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
    </svg>);
const UploadIcon = ({className = "h-10 w-10"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"
         strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>);
const CheckIcon = ({className = "h-14 w-14"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"
         strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>);
const SpinnerIcon = ({className = "h-4 w-4"}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
         aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>);
const TrashIcon = ({className = "h-4 w-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"
         strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
    </svg>);

const CvUpload = ({
                      dark, uploadState, selectedFile, fileError, serverError,
                      isDragging, isReplacing, fileInputRef,
                      onFileChosen, onDragOver, onDragLeave, onDrop,
                      onOpenFilePicker, onClearFile, onUpload, onRetry,
                      onCancelReplacing, onGoToDashboard, onGoToList,
                      maxFileSizeMb = 2, acceptedExt = ".pdf",
                  }) => {
    const {t} = useTranslation();
    const {cardClass, titleClass, submitClass, serverErrorClass} = getAuthClasses(dark);
    const u = getCvUploadClasses(dark, isDragging);

    const hiddenInput = (
        <input
            ref={fileInputRef} type="file" accept={acceptedExt}
            className="sr-only" aria-hidden="true" tabIndex={-1}
            onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
    );

    if (uploadState === "SUCCESS") {
        return (
            <div className={cardClass}>
                <div className={`flex flex-col items-center gap-3 py-6 ${u.successText}`} role="status"
                     aria-live="polite">
                    <CheckIcon/>
                    <p className="text-lg font-semibold">{t("cvUpload.successMsg")}</p>
                </div>
                <button onClick={onGoToList} className={submitClass} autoFocus>{t("cvUpload.viewDocsBtn")}</button>
                <button onClick={onGoToDashboard}
                        className={`${u.ghostBtn} mt-3 w-full text-center`}>{t("cvUpload.continueBtn")}</button>
            </div>
        );
    }

    if (["FILE_READY", "UPLOADING", "ERROR"].includes(uploadState)) {
        const isUploading = uploadState === "UPLOADING";
        const hasError = uploadState === "ERROR";

        return (
            <div className={cardClass}>
                {hiddenInput}
                <h1 className={titleClass}>{isReplacing ? t("cvUpload.replaceBtn") : t("cvUpload.uploadBtn")}</h1>

                {hasError && serverError && (
                    <div className={serverErrorClass} role="alert" aria-live="assertive">{serverError}</div>
                )}

                <div className={u.fileCard} aria-label="Selected file">
                    <PdfIcon className={`h-10 w-10 shrink-0 ${u.iconColor}`}/>
                    <div className="min-w-0 flex-1">
                        <p className={u.fileName}>{selectedFile?.name}</p>
                        <p className={u.fileMeta}>PDF · {formatBytes(selectedFile?.size ?? 0)}</p>
                    </div>
                    {!isUploading && (
                        <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={onOpenFilePicker} className={u.ghostBtn}
                                    aria-label="Replace selected file">{t("cvUpload.replaceFile")}
                            </button>
                            <button onClick={onClearFile} className={u.dangerBtn}
                                    aria-label="Supprimer le fichier sélectionné">
                                <span className="flex items-center gap-1.5"><TrashIcon/>{t("cvUpload.deleteBtn")}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Action buttons — each branch is self-contained so Cancel renders exactly once */}
                <div className="mt-6 flex flex-col gap-3">
                    {hasError ? (
                        <>
                            <button onClick={onRetry} className={submitClass}>{t("cvUpload.retryBtn")}</button>
                            <button onClick={onClearFile}
                                    className={`${u.ghostBtn} text-center`}>{t("cvUpload.cancelBtn")}</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onUpload} disabled={isUploading} className={submitClass}
                                    aria-busy={isUploading}>
                                {isUploading
                                    ? <span
                                        className="flex items-center justify-center gap-2"><SpinnerIcon/>{t("cvUpload.uploadingLabel")}</span>
                                    : t("cvUpload.uploadBtn")}
                            </button>
                            {!isUploading && (
                                <button onClick={onClearFile}
                                        className={`${u.ghostBtn} text-center`}>{t("cvUpload.cancelBtn")}</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── IDLE — dropzone ───────────────────────────────────────────────────────

    return (
        <div className={cardClass}>
            {hiddenInput}
            <h1 className={titleClass}>{t("cvUpload.pageTitle")}</h1>
            <p className={u.subtitle}>{t("cvUpload.pageSubtitle")}</p>

            {fileError && (
                <div className={`mb-4 ${serverErrorClass}`} role="alert" aria-live="assertive">{fileError}</div>
            )}

            <div
                className={u.dropzone}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={onOpenFilePicker}
                role="button" tabIndex={0} aria-label="File drop zone. Click or drag a PDF."
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenFilePicker();
                    }
                }}
            >
                <UploadIcon className={`h-10 w-10 ${isDragging ? "text-indigo-500" : u.iconColor}`}/>
                <div>
                    <p className={u.dragHintText}>
                        {t("cvUpload.dragHint")}{" "}
                        <span
                            className="text-indigo-500 underline underline-offset-2 cursor-pointer">{t("cvUpload.orBrowse")}</span>
                    </p>
                    <p className={u.hint}>{t("cvUpload.acceptedFormats")}</p>
                    <p className={u.hint}>{t("cvUpload.maxSize", {mb: maxFileSizeMb})}</p>
                </div>
            </div>

            <button onClick={onOpenFilePicker} className={`${submitClass} mt-6`} type="button">
                {isReplacing ? t("cvUpload.replaceBtn") : t("cvUpload.uploadBtn")}
            </button>

            {isReplacing && (
                <button onClick={onCancelReplacing} className={`${u.ghostBtn} mt-3 w-full text-center`} type="button">
                    {t("cvUpload.cancelBtn")}
                </button>
            )}
        </div>
    );
};

export default CvUpload;