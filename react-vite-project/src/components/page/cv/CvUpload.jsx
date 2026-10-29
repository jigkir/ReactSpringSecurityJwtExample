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
 * `fileError` / `serverError` are {key, options?} objects (or null) and are
 * translated HERE at render time, so they follow the language switch live.
 */

import {getAuthClasses, getCvUploadClasses} from '../../../styles/AppStyles.jsx';
import {formatBytes} from './cvUtils.js';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import Icon from '../../../styles/Icon.jsx';
import {translateWarning} from '../../../utils/CommonFields.jsx';

const PdfIcon = ({className = ""}) => <Icon name="picture_as_pdf" size={40} className={className}/>;
const UploadIcon = ({className = ""}) => <Icon name="upload_file" size={40} className={className}/>;
const CheckIcon = ({className = ""}) => <Icon name="check_circle" size={56} className={className}/>;
const SpinnerIcon = ({className = ""}) => <Icon name="progress_activity" size={16}
                                                className={`animate-spin ${className}`}/>;

const CvUpload = ({
                      dark, uploadState, selectedFile, fileError, serverError,
                      isDragging, isReplacing, fileInputRef,
                      onFileChosen, onDragOver, onDragLeave, onDrop,
                      onOpenFilePicker, onClearFile, onUpload, onRetry,
                      onCancelReplacing, onGoToDashboard, onGoToList,
                      maxFileSizeMb = 2, acceptedExt = ".pdf",
                  }) => {
    const {t, i18n} = useTranslation();
    const {cardClass, titleClass, serverErrorClass} = getAuthClasses(dark);
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
                <Button tone="primary" size="lg" dark={dark} onClick={onGoToList} autoFocus className="w-full">
                    {t("cvUpload.viewDocsBtn")}
                </Button>
                <Button tone="ghost" dark={dark} onClick={onGoToDashboard} className="mt-3 w-full">
                    {t("cvUpload.continueBtn")}
                </Button>
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
                    <div className={serverErrorClass} role="alert"
                         aria-live="assertive">{translateWarning(t, serverError)}</div>
                )}

                <div className={u.fileCard} aria-label={t("cvUpload.selectedFileAria")}>
                    <PdfIcon className={`h-10 w-10 shrink-0 ${u.iconColor}`}/>
                    <div className="min-w-0 flex-1">
                        <p className={u.fileName}>{selectedFile?.name}</p>
                        <p className={u.fileMeta}>PDF
                            · {formatBytes(selectedFile?.size ?? 0, i18n.resolvedLanguage ?? i18n.language)}</p>
                    </div>
                    {!isUploading && (
                        <div className="flex flex-col gap-1 shrink-0">
                            <Button tone="ghost" dark={dark} onClick={onOpenFilePicker}
                                    aria-label={t("cvUpload.replaceFileAria")}>
                                {t("cvUpload.replaceFile")}
                            </Button>
                            <Button tone="danger" dark={dark} icon="delete" onClick={onClearFile}
                                    aria-label={t("cvUpload.deleteFileAria")}>
                                {t("cvUpload.deleteBtn")}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Action buttons — each branch is self-contained so Cancel renders exactly once */}
                <div className="mt-6 flex flex-col gap-3">
                    {hasError ? (
                        <>
                            <Button tone="primary" size="lg" dark={dark} onClick={onRetry}>
                                {t("cvUpload.retryBtn")}
                            </Button>
                            <Button tone="ghost" dark={dark} onClick={onClearFile}>
                                {t("cvUpload.cancelBtn")}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button tone="primary" size="lg" dark={dark} onClick={onUpload}
                                    disabled={isUploading} aria-busy={isUploading}>
                                {isUploading
                                    ? <><SpinnerIcon/>{t("cvUpload.uploadingLabel")}</>
                                    : t("cvUpload.uploadBtn")}
                            </Button>
                            {!isUploading && (
                                <Button tone="ghost" dark={dark} onClick={onClearFile}>
                                    {t("cvUpload.cancelBtn")}
                                </Button>
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
                <div className={`mb-4 ${serverErrorClass}`} role="alert"
                     aria-live="assertive">{translateWarning(t, fileError)}</div>
            )}

            <div
                className={u.dropzone}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={onOpenFilePicker}
                role="button" tabIndex={0} aria-label={t("cvUpload.dropzoneAria")}
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

            <Button type="button" tone="primary" size="lg" dark={dark} onClick={onOpenFilePicker}
                    className="mt-6 w-full">
                {isReplacing ? t("cvUpload.replaceBtn") : t("cvUpload.uploadBtn")}
            </Button>

            {isReplacing && (
                <Button type="button" tone="ghost" dark={dark} onClick={onCancelReplacing} className="mt-3 w-full">
                    {t("cvUpload.cancelBtn")}
                </Button>
            )}
        </div>
    );
};

export default CvUpload;