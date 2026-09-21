/**
 * Cv.jsx — Parent / state machine for the student CV flow.
 *
 * Owns all shared state and decides which child to render:
 *   LOADING_CV              → skeleton (waiting for auth + CV count)
 *   IDLE / FILE_READY /
 *   UPLOADING / ERROR /
 *   SUCCESS                 → <CvUpload />
 *   EXISTING (not replacing)→ <CvDocuments />
 *
 * Backend endpoints used (StudentController.java):
 *   POST /api/student/{studentId}/cvs          multipart: file
 *   GET  /api/student/{studentId}/cvs/count    Long — used to detect "has CV"
 *   GET  /api/max-cv-size                      Integer — max upload size in bytes
 *
 * Endpoints used by CvDocuments:
 *   GET  /api/student/{studentId}/cvs          ← implemented
 *   // NOT YET IMPLEMENTED:
 *   //   GET    /api/student/cv/{cvId}/file
 *   //   PUT    /api/student/{studentId}/cvs/{cvId}/hide|public|private
 *   //   DELETE /api/student/cv/{cvId}
 *
 * ─── studentId resolution ────────────────────────────────────────────────────
 * App.jsx spreads the full UserResponseDto onto the user object.
 * The exact JSON field name depends on how the backend serializes it.
 * We try every known candidate in priority order so the component works
 * regardless of how the DTO is named on the backend:
 *
 *   user.studentId   ← StudentSignUpDto field name (most likely)
 *   user.matricule   ← alternate Java entity field name
 *   user.id          ← generic fallback
 *
 * If you add a new field name in UserResponseDto, add it here too.
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import {useNavigate, useOutletContext} from 'react-router-dom';
import {getAuthClasses} from '../auth/styles/authStyles.jsx';
import CvUpload    from './CvUpload.jsx';
import CvDocuments from './CvDocuments.jsx';
import fetcher     from '../../../utils/fetcher.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_MAX_BYTES = 2 * 1024 * 1024; // 2 MB fallback if GET /max-cv-size fails

export const ACCEPTED_MIME = 'application/pdf';
export const ACCEPTED_EXT  = '.pdf';

export const STATE = {
    LOADING_CV: 'LOADING_CV',
    IDLE:       'IDLE',
    EXISTING:   'EXISTING',
    FILE_READY: 'FILE_READY',
    UPLOADING:  'UPLOADING',
    SUCCESS:    'SUCCESS',
    ERROR:      'ERROR',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve the student's matricule/ID from the user object.
 * Tries every field name the backend might use, in priority order.
 * Returns an empty string when user is not yet loaded.
 */
function resolveStudentId(user) {
    if (!user) return '';
    // Try every candidate field name; return the first truthy one.
    return (
        user.studentId  ||   // most likely — matches StudentSignUpDto field
        user.matricule  ||   // alternate entity field name
        user.id         ||   // generic numeric id (convert to string)
        ''
    ).toString();
}

export function validateFile(file, maxBytes = FALLBACK_MAX_BYTES) {
    if (!file) return 'Aucun fichier sélectionné.';
    if (file.type !== ACCEPTED_MIME && !file.name.toLowerCase().endsWith(ACCEPTED_EXT)) {
        return 'Format de fichier invalide. Veuillez sélectionner un fichier PDF.';
    }
    if (file.size > maxBytes) {
        const mb = (maxBytes / (1024 * 1024)).toFixed(0);
        return `Votre fichier est trop volumineux. La taille maximale autorisée est de ${mb} Mo.`;
    }
    return null;
}

async function hasResume(studentId) {
    // GET /api/student/{studentId}/cvs/count → Long
    const res = await fetcher(`student/${studentId}/cvs/count`, {method: 'GET'});
    if (!res.ok) return false;
    return (await res.json()) > 0;
}

async function uploadResume(file, studentId) {
    // POST /api/student/{studentId}/cvs — multipart: file only
    const form = new FormData();
    form.append('file', file);
    return fetcher(`student/${studentId}/cvs`, {
        method:  'POST',
        headers: {Accept: 'application/json'},
        body:    form,
    });
}

// ─── Component ───────────────────────────────────────────────────────────────

const Cv = ({user}) => {
    const navigate    = useNavigate();
    const {dark}      = useOutletContext();
    const {pageClass} = getAuthClasses(dark);

    // Resolve studentId from whichever field the backend actually sends.
    // This re-computes whenever user changes, so it becomes non-empty as soon
    // as App.jsx's auth effect finishes and calls setUser({...data, isLoggedIn:true}).
    const studentId  = resolveStudentId(user);
    const isLoggedIn = user?.isLoggedIn ?? false;

    const fileInputRef = useRef(null);

    const [uploadState,  setUploadState]  = useState(STATE.LOADING_CV);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError,    setFileError]    = useState('');
    const [serverError,  setServerError]  = useState('');
    const [isDragging,   setIsDragging]   = useState(false);
    const [isReplacing,  setIsReplacing]  = useState(false);
    const [maxBytes,     setMaxBytes]     = useState(FALLBACK_MAX_BYTES);

    // ── Auth + CV-count check ─────────────────────────────────────────────────
    //
    // Stay in LOADING_CV skeleton until BOTH of these are true:
    //   1. isLoggedIn is true  (App.jsx auth effect has resolved)
    //   2. studentId is non-empty (UserResponseDto field is known)
    //
    // If isLoggedIn is true but studentId is still empty after the effect runs,
    // we fall to IDLE so the student can still use the upload form (they will
    // get a server error on submit, which is the right outcome if the backend
    // really did not send an ID).

    useEffect(() => {
        if (!isLoggedIn) return;    // auth not resolved yet — stay in skeleton

        if (!studentId) {
            // Logged in but no recognisable studentId field in UserResponseDto.
            // Fall to IDLE rather than spinning forever. The upload will fail
            // server-side, which is the correct signal to fix the DTO field name.
            console.warn(
                '[Cv] Could not find studentId in user object. ' +
                'Check that UserResponseDto serialises the field as ' +
                '"studentId", "matricule", or "id". Received keys:',
                Object.keys(user ?? {})
            );
            setUploadState(STATE.IDLE);
            return;
        }

        let cancelled = false;
        Promise.all([
            fetcher('max-cv-size', {method: 'GET'})
                .then(async (r) => r.ok ? r.json() : FALLBACK_MAX_BYTES)
                .catch(() => FALLBACK_MAX_BYTES),
            hasResume(studentId).catch(() => false),
        ]).then(([bytes, exists]) => {
            if (cancelled) return;
            setMaxBytes(bytes);
            setUploadState(exists ? STATE.EXISTING : STATE.IDLE);
        });

        return () => { cancelled = true; };
    }, [isLoggedIn, studentId]);

    // ── File selection ────────────────────────────────────────────────────────

    const handleFileChosen = useCallback((file) => {
        if (!file) return;
        setFileError('');
        setServerError('');
        const error = validateFile(file, maxBytes);
        if (error) { setFileError(error); setSelectedFile(null); return; }
        setSelectedFile(file);
        setUploadState(STATE.FILE_READY);
    }, [maxBytes]);

    const openFilePicker = () => { setFileError(''); fileInputRef.current?.click(); };

    const clearFile = () => {
        setSelectedFile(null);
        setFileError('');
        setServerError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadState(isReplacing ? STATE.EXISTING : STATE.IDLE);
        if (isReplacing) setIsReplacing(false);
    };

    const startReplacing = () => {
        setIsReplacing(true);
        setSelectedFile(null);
        setFileError('');
        setServerError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadState(STATE.IDLE);
    };

    const cancelReplacing = () => { setIsReplacing(false); setUploadState(STATE.EXISTING); };

    // ── Drag & drop ───────────────────────────────────────────────────────────

    const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = ()  => setIsDragging(false);
    const onDrop      = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChosen(e.dataTransfer.files?.[0]);
    };

    // ── Upload ────────────────────────────────────────────────────────────────

    const handleUpload = async () => {
        if (!selectedFile || uploadState === STATE.UPLOADING) return;

        // Hard guard — should never happen in normal flow, but prevents the
        // double-slash URL bug if somehow the upload button is reachable before
        // the user object is fully loaded.
        if (!studentId) {
            setServerError(
                'Identifiant étudiant introuvable. Veuillez vous déconnecter et vous reconnecter.'
            );
            setUploadState(STATE.ERROR);
            return;
        }

        setUploadState(STATE.UPLOADING);
        setServerError('');

        try {
            const response = await uploadResume(selectedFile, studentId);
            if (response.ok) { setUploadState(STATE.SUCCESS); return; }

            let body = {};
            try { body = await response.json(); } catch { /* non-JSON body — ignore */ }
            const code = body?.code ?? body?.error ?? '';

            if (code === 'INVALID_FILE' || code === 'CORRUPTED_FILE' || response.status === 415) {
                setServerError('Le fichier semble corrompu ou invalide. Veuillez en sélectionner un autre.');
            } else if (response.status === 413) {
                const mb = (maxBytes / (1024 * 1024)).toFixed(0);
                setServerError(`Votre fichier est trop volumineux. La taille maximale autorisée est de ${mb} Mo.`);
            } else {
                setServerError('Le téléversement a échoué. Veuillez réessayer.');
            }
            setUploadState(STATE.ERROR);
        } catch {
            setServerError('Le téléversement a échoué. Veuillez réessayer.');
            setUploadState(STATE.ERROR);
        }
    };

    const handleRetry   = () => { setServerError(''); setUploadState(STATE.FILE_READY); };
    const goToDashboard = () => navigate('/home');
    const goToList      = () => {
        setSelectedFile(null);
        setIsReplacing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadState(STATE.EXISTING);
    };

    // ── Skeleton ──────────────────────────────────────────────────────────────

    if (uploadState === STATE.LOADING_CV) {
        const skel = dark ? 'bg-slate-700' : 'bg-gray-200';
        return (
            <div className={pageClass} aria-busy="true" aria-label="Chargement…">
                <div className="w-full max-w-lg p-8 rounded-2xl shadow-lg border animate-pulse bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <div className={`h-8 rounded-lg mb-4 ${skel}`}/>
                    <div className={`h-4 rounded w-3/4 mx-auto mb-6 ${skel}`}/>
                    <div className={`h-40 rounded-xl ${skel}`}/>
                </div>
            </div>
        );
    }

    // ── Documents list ────────────────────────────────────────────────────────

    if (uploadState === STATE.EXISTING && !isReplacing) {
        return (
            <div className={pageClass}>
                <div className="w-full max-w-4xl flex flex-col gap-4">
                    {/* Hidden input kept alive so startReplacing can open the picker */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXT}
                        className="sr-only"
                        aria-hidden="true"
                        tabIndex={-1}
                        onChange={(e) => handleFileChosen(e.target.files?.[0])}
                    />
                    <CvDocuments
                        studentId={studentId}
                        dark={dark}
                        onAddClick={startReplacing}
                    />
                    <button
                        onClick={goToDashboard}
                        className={`self-center text-sm font-medium px-3 py-1.5 rounded-lg transition-colors
                            ${dark
                                ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        Accéder à mon tableau de bord
                    </button>
                </div>
            </div>
        );
    }

    // ── Upload flow ───────────────────────────────────────────────────────────

    return (
        <div className={pageClass}>
            <CvUpload
                dark={dark}
                uploadState={uploadState}
                selectedFile={selectedFile}
                fileError={fileError}
                serverError={serverError}
                isDragging={isDragging}
                isReplacing={isReplacing}
                fileInputRef={fileInputRef}
                onFileChosen={handleFileChosen}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onOpenFilePicker={openFilePicker}
                onClearFile={clearFile}
                onUpload={handleUpload}
                onRetry={handleRetry}
                onCancelReplacing={cancelReplacing}
                onGoToDashboard={goToDashboard}
                onGoToList={goToList}
                maxFileSizeMb={(maxBytes / (1024 * 1024)).toFixed(0)}
                acceptedExt={ACCEPTED_EXT}
            />
        </div>
    );
};

export default Cv;