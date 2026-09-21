/**
 * CvUpload.jsx — Pure UI for the CV upload flow.
 *
 * Renders one of four sub-views depending on `uploadState`:
 *   IDLE        → dropzone
 *   FILE_READY  → file preview card + upload button
 *   UPLOADING   → file preview card + spinner
 *   ERROR       → file preview card + retry/cancel
 *   SUCCESS     → success confirmation
 *
 * All state lives in the parent (Cv.jsx). This component is stateless:
 * it receives everything it needs as props and calls handler callbacks.
 *
 * Props
 *   dark              boolean
 *   uploadState       string  (one of STATE.* from Cv.jsx)
 *   selectedFile      File | null
 *   fileError         string
 *   serverError       string
 *   isDragging        boolean
 *   isReplacing       boolean
 *   fileInputRef      React ref
 *   onFileChosen      (File) => void
 *   onDragOver        (e) => void
 *   onDragLeave       () => void
 *   onDrop            (e) => void
 *   onOpenFilePicker  () => void
 *   onClearFile       () => void
 *   onUpload          () => void
 *   onRetry           () => void
 *   onCancelReplacing () => void
 *   onGoToDashboard   () => void
 *   onGoToList        () => void
 */

import {getAuthClasses} from '../auth/styles/authStyles.jsx';
import CvButton from './CvButton.jsx';

// ─── Constants (inlined from Cv.jsx via import) ───────────────────────────────
// Cv.jsx passes MAX_FILE_SIZE_MB and ACCEPTED_EXT as props or we import from Cv.
// Since CvUpload is a pure-UI leaf, accept them as props with safe defaults.

const DEFAULT_MAX_MB  = 5;
const DEFAULT_EXT     = '.pdf';

// ─── Texts ───────────────────────────────────────────────────────────────────

const TEXTS = {
    pageTitle:       'Téléversez votre CV',
    pageSubtitle:    'Votre CV est requis pour accéder à votre tableau de bord et postuler aux offres de stage.',
    uploadBtn:       'Téléverser mon CV',
    replaceBtn:      'Ajouter un CV',
    cancelBtn:       'Annuler',
    deleteBtn:       'Supprimer',
    retryBtn:        'Réessayer',
    continueBtn:     'Accéder à mon tableau de bord',
    viewDocsBtn:     'Voir mes documents',
    uploadingLabel:  'Téléversement en cours…',
    successMsg:      'Votre CV a été téléversé avec succès.',
    dragHint:        'Glissez-déposez votre CV ici ou',
    orBrowse:        'parcourir',
    acceptedFormats: 'Format accepté : PDF',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const PdfIcon = ({className = 'h-10 w-10'}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
    </svg>
);

const UploadIcon = ({className = 'h-10 w-10'}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
);

const CheckIcon = ({className = 'h-14 w-14'}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
);

const SpinnerIcon = ({className = 'h-4 w-4'}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg"
         fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
);

const TrashIcon = ({className = 'h-4 w-4'}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
    </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

const CvUpload = ({
    dark,
    uploadState,
    selectedFile,
    fileError,
    serverError,
    isDragging,
    isReplacing,
    fileInputRef,
    onFileChosen,
    onDragOver,
    onDragLeave,
    onDrop,
    onOpenFilePicker,
    onClearFile,
    onUpload,
    onRetry,
    onCancelReplacing,
    onGoToDashboard,
    onGoToList,
    maxFileSizeMb  = DEFAULT_MAX_MB,
    acceptedExt    = DEFAULT_EXT,
}) => {
    const {cardClass, titleClass, submitClass, serverErrorClass} = getAuthClasses(dark);

    const iconColor = dark ? 'text-indigo-400' : 'text-indigo-600';

    const ghostBtn = `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        ${dark ? 'text-slate-300 hover:text-white hover:bg-slate-700'
               : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`;

    const dangerBtn = `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
        ${dark ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
               : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`;

    const fileCard = `mt-4 flex items-start gap-4 p-4 rounded-xl border
        ${dark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`;

    const dropzone = `relative mt-4 flex flex-col items-center justify-center gap-3 rounded-xl
        border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 cursor-pointer
        focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500
        ${isDragging
            ? dark ? 'border-indigo-400 bg-indigo-900/20' : 'border-indigo-500 bg-indigo-50'
            : dark  ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-700/30'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`;

    const hint = `text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`;

    // Shared hidden file input
    const HiddenInput = () => (
        <input
            ref={fileInputRef}
            type="file"
            accept={acceptedExt}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
    );

    // ── States ────────────────────────────────────────────────────────────────

    if (uploadState === 'SUCCESS') {
        return (
            <div className={cardClass}>
                <div
                    className={`flex flex-col items-center gap-3 py-6 ${dark ? 'text-green-400' : 'text-green-600'}`}
                    role="status" aria-live="polite"
                >
                    <CheckIcon/>
                    <p className="text-lg font-semibold">{TEXTS.successMsg}</p>
                </div>
                <button onClick={onGoToList} className={submitClass} autoFocus>
                    {TEXTS.viewDocsBtn}
                </button>
                <button onClick={onGoToDashboard} className={`${ghostBtn} mt-3 w-full text-center`}>
                    {TEXTS.continueBtn}
                </button>
            </div>
        );
    }

    // ── File ready / uploading / error ────────────────────────────────────────

    if (['FILE_READY', 'UPLOADING', 'ERROR'].includes(uploadState)) {
        const isUploading = uploadState === 'UPLOADING';
        const hasError    = uploadState === 'ERROR';

        return (
            <div className={cardClass}>
                <HiddenInput/>
                <h1 className={titleClass}>
                    {isReplacing ? TEXTS.replaceBtn : TEXTS.uploadBtn}
                </h1>

                {hasError && serverError && (
                    <div className={serverErrorClass} role="alert" aria-live="assertive">
                        {serverError}
                    </div>
                )}

                <div className={fileCard} aria-label="Fichier sélectionné">
                    <PdfIcon className={`h-10 w-10 shrink-0 ${iconColor}`}/>
                    <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate break-all ${dark ? 'text-white' : 'text-gray-800'}`}>
                            {selectedFile?.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                            PDF · {formatBytes(selectedFile?.size ?? 0)}
                        </p>
                    </div>
                    {!isUploading && (
                        <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={onOpenFilePicker} className={ghostBtn}
                                    aria-label="Remplacer le fichier sélectionné">
                                Remplacer
                            </button>
                            <button onClick={onClearFile} className={dangerBtn}
                                    aria-label="Supprimer le fichier sélectionné">
                                <span className="flex items-center gap-1.5">
                                    <TrashIcon/>{TEXTS.deleteBtn}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    {hasError ? (
                        <>
                            <button onClick={onRetry}     className={submitClass}>{TEXTS.retryBtn}</button>
                            <button onClick={onClearFile} className={`${ghostBtn} text-center`}>{TEXTS.cancelBtn}</button>
                        </>
                    ) : (
                        <button onClick={onUpload} disabled={isUploading} className={submitClass} aria-busy={isUploading}>
                            {isUploading
                                ? <span className="flex items-center justify-center gap-2"><SpinnerIcon/>{TEXTS.uploadingLabel}</span>
                                : TEXTS.uploadBtn}
                        </button>
                    )}
                    {!isUploading && (
                        <button onClick={onClearFile} className={`${ghostBtn} text-center`}>
                            {TEXTS.cancelBtn}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── IDLE — dropzone ───────────────────────────────────────────────────────

    return (
        <div className={cardClass}>
            <HiddenInput/>

            <h1 className={titleClass}>{TEXTS.pageTitle}</h1>

            <p className={`text-center text-sm mb-6 ${dark ? 'text-slate-300' : 'text-gray-600'}`}>
                {TEXTS.pageSubtitle}
            </p>

            {fileError && (
                <div className={`mb-4 ${serverErrorClass}`} role="alert" aria-live="assertive">
                    {fileError}
                </div>
            )}

            <div
                className={dropzone}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={onOpenFilePicker}
                role="button"
                tabIndex={0}
                aria-label="Zone de dépôt de fichier. Cliquez ou glissez un PDF."
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenFilePicker(); } }}
            >
                <UploadIcon className={`h-10 w-10 ${isDragging ? 'text-indigo-500' : iconColor}`}/>
                <div>
                    <p className={`text-sm font-medium ${dark ? 'text-slate-200' : 'text-gray-700'}`}>
                        {TEXTS.dragHint}{' '}
                        <span className="text-indigo-500 underline underline-offset-2 cursor-pointer">
                            {TEXTS.orBrowse}
                        </span>
                    </p>
                    <p className={hint}>{TEXTS.acceptedFormats}</p>
                    <p className={hint}>{`Taille maximale : ${maxFileSizeMb} Mo`}</p>
                </div>
            </div>

            <button onClick={onOpenFilePicker} className={`${submitClass} mt-6`} type="button">
                {isReplacing ? TEXTS.replaceBtn : TEXTS.uploadBtn}
            </button>

            {isReplacing && (
                <button onClick={onCancelReplacing} className={`${ghostBtn} mt-3 w-full text-center`} type="button">
                    {TEXTS.cancelBtn}
                </button>
            )}
        </div>
    );
};

export default CvUpload;