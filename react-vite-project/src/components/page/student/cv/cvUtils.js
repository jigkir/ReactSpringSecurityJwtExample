// ─── Upload-state machine ─────────────────────────────────────────────────────

export const STATE = {
    LOADING_CV: "LOADING_CV",
    IDLE: "IDLE",
    EXISTING: "EXISTING",
    FILE_READY: "FILE_READY",
    UPLOADING: "UPLOADING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
};

// ─── File constraints ─────────────────────────────────────────────────────────

export const FALLBACK_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_MIME = "application/pdf";
export const ACCEPTED_EXT = ".pdf";

// ─── Student-ID resolution ────────────────────────────────────────────────────

/**
 * Resolve the student's matricule/ID from the user object.
 * Priority: studentId → matricule → id (numeric fallback)
 * Returns "" when user is not yet loaded.
 */
export function resolveStudentId(user) {
    if (!user) return "";
    return (user.studentId || user.matricule || user.id || "").toString();
}

// ─── File validation ──────────────────────────────────────────────────────────

/**
 * Returns { key, options } for t() when the file is invalid, or null when acceptable.
 * Keeping translation out of this utility preserves its framework-agnostic nature.
 */
export function validateFile(file, maxBytes = FALLBACK_MAX_BYTES) {
    if (!file) return { key: "cvUpload.validation.noFile" };
    if (file.type !== ACCEPTED_MIME && !file.name.toLowerCase().endsWith(ACCEPTED_EXT)) {
        return { key: "cvUpload.validation.invalidFormat" };
    }
    if (file.size > maxBytes) {
        return { key: "cvUpload.validation.tooLarge", options: { mb: (maxBytes / (1024 * 1024)).toFixed(0) } };
    }
    return null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** en-CA renders dates as YYYY-MM-DD */
export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-CA");

/** Sort CVDto array newest-first */
export const sortDocs = (list) =>
    [...list].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

// ─── Blob / PDF helpers ───────────────────────────────────────────────────────

/**
 * Convert a Base64-encoded PDF string (Jackson-serialised Java byte[])
 * into an object-URL usable in an <iframe> or window.open().
 * IMPORTANT: caller must call URL.revokeObjectURL(url) when done.
 */
export function base64ToBlobUrl(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], {type: ACCEPTED_MIME}));
}