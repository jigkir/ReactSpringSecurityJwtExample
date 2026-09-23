/**
 * Cv.jsx — Parent / state machine for the student CV flow.
 *
 * Owns all shared state and decides which child to render:
 *   LOADING_CV                → skeleton
 *   IDLE / FILE_READY /
 *   UPLOADING / ERROR /
 *   SUCCESS                   → <CvUpload />
 *   EXISTING (not replacing)  → <CvDocuments />
 *
 * Backend endpoints (StudentController.java):
 *   POST /api/student/{studentId}/cvs       multipart: file
 *   GET  /api/student/{studentId}/cvs/count Long
 *   GET  /api/max-cv-size                   Integer
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getAuthClasses} from '../../../styles/appStyles.jsx';
import CvUpload from './cv/CvUpload.jsx';
import CvDocuments from './cv/CvDocuments.jsx';
import fetcher from '../../../utils/fetcher.js';
import {ACCEPTED_EXT, FALLBACK_MAX_BYTES, resolveStudentId, STATE, validateFile,} from './cv/cvUtils.js';

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchMaxBytes() {
    try {
        const res = await fetcher("max-cv-size", {method: "GET"});
        return res.ok ? res.json() : FALLBACK_MAX_BYTES;
    } catch {
        return FALLBACK_MAX_BYTES;
    }
}

async function hasResume(studentId) {
    try {
        const res = await fetcher(`student/${studentId}/cvs/count`, {method: "GET"});
        return res.ok && (await res.json()) > 0;
    } catch {
        return false;
    }
}

async function uploadResume(file, studentId) {
    const form = new FormData();
    form.append("file", file);
    return fetcher(`student/${studentId}/cvs`, {
        method: "POST",
        headers: {Accept: "application/json"},
        body: form,
    });
}

// ─── Component ───────────────────────────────────────────────────────────────

const Cv = ({user}) => {
    const navigate = useNavigate();
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {pageClass} = getAuthClasses(dark);

    const studentId = resolveStudentId(user);
    const isLoggedIn = user?.isLoggedIn ?? false;

    const fileInputRef = useRef(null);

    const [uploadState, setUploadState] = useState(STATE.LOADING_CV);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [serverError, setServerError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const [maxBytes, setMaxBytes] = useState(FALLBACK_MAX_BYTES);

    // ── Auth + CV-count check ─────────────────────────────────────────────────
    //
    // Stay in LOADING_CV until BOTH isLoggedIn is true AND studentId is
    // non-empty. If the studentId is missing despite being logged in, fall to
    // IDLE so the student can still interact — they'll get a server error on
    // submit, which is the correct signal to fix the DTO field name.

    useEffect(() => {
        if (!isLoggedIn) return;

        if (!studentId) {
            console.warn(
                "[Cv] Could not find studentId in user object. " +
                "Check that UserResponseDto serializes the field as " +
                "studentId, matricule, or id. Received keys:",
                Object.keys(user ?? {}),
            );
            setUploadState(STATE.IDLE);
            return;
        }

        let cancelled = false;
        Promise.all([fetchMaxBytes(), hasResume(studentId)]).then(([bytes, exists]) => {
            if (cancelled) return;
            setMaxBytes(bytes);
            setUploadState(exists ? STATE.EXISTING : STATE.IDLE);
        });

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, studentId]);

    // ── File selection ────────────────────────────────────────────────────────

    const handleFileChosen = useCallback((file) => {
        if (!file) return;
        setFileError("");
        setServerError("");
        const error = validateFile(file, maxBytes);
        if (error) {
            setFileError(t(error.key, error.options));
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
        setUploadState(STATE.FILE_READY);
    }, [maxBytes]);

    const openFilePicker = () => {
        setFileError("");
        fileInputRef.current?.click();
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFileError("");
        setServerError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadState(isReplacing ? STATE.EXISTING : STATE.IDLE);
        if (isReplacing) setIsReplacing(false);
    };

    const startReplacing = () => {
        setIsReplacing(true);
        setSelectedFile(null);
        setFileError("");
        setServerError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadState(STATE.IDLE);
    };

    const cancelReplacing = () => {
        setIsReplacing(false);
        setUploadState(STATE.EXISTING);
    };

    // ── Drag & drop ───────────────────────────────────────────────────────────

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChosen(e.dataTransfer.files?.[0]);
    };

    // ── Upload ────────────────────────────────────────────────────────────────

    const handleUpload = async () => {
        if (!selectedFile || uploadState === STATE.UPLOADING) return;

        if (!studentId) {
            setServerError(t("cv.studentIdMissing"));
            setUploadState(STATE.ERROR);
            return;
        }

        setUploadState(STATE.UPLOADING);
        setServerError("");

        try {
            const response = await uploadResume(selectedFile, studentId);
            if (response.ok) {
                setUploadState(STATE.SUCCESS);
                return;
            }

            let body = {};
            try {
                body = await response.json();
            } catch { /* non-JSON body */
            }
            const code = body?.code ?? body?.error ?? "";

            if (code === "INVALID_FILE" || code === "CORRUPTED_FILE" || response.status === 415) {
                setServerError(t("cv.fileInvalid"));
            } else if (response.status === 413) {
                setServerError(t("cv.fileTooLarge", {mb: (maxBytes / (1024 * 1024)).toFixed(0)}));
            } else {
                setServerError(t("cv.uploadFailed"));
            }
            setUploadState(STATE.ERROR);
        } catch {
            setServerError(t("cv.uploadFailed"));
            setUploadState(STATE.ERROR);
        }
    };

    const handleRetry = () => {
        setServerError("");
        setUploadState(STATE.FILE_READY);
    };
    const goToDashboard = () => navigate("/home");
    const goToList = () => {
        setSelectedFile(null);
        setIsReplacing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploadState(STATE.EXISTING);
    };

    // ── Skeleton ──────────────────────────────────────────────────────────────

    if (uploadState === STATE.LOADING_CV) {
        const skel = dark ? "bg-slate-700" : "bg-gray-200";
        return (
            <div className={pageClass} aria-busy="true" aria-label="Loading…">
                <div
                    className="w-full max-w-lg p-8 rounded-2xl shadow-lg border animate-pulse bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700">
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
                            ? "text-slate-300 hover:text-white hover:bg-slate-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}
                    >
                        {t("cv.goToDashboard")}
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