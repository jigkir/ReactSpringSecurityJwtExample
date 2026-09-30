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

export function resolveStudentId(user) {
    if (!user) return "";
    return (user.studentId || user.matricule || user.id || "").toString();
}

// ─── File validation ──────────────────────────────────────────────────────────

/** Returns { key, options } for t() when the file is invalid, or null when acceptable. */
export function validateFile(file, maxBytes = FALLBACK_MAX_BYTES) {
    if (!file) return {key: "cvUpload.validation.noFile"};
    if (file.type !== ACCEPTED_MIME && !file.name.toLowerCase().endsWith(ACCEPTED_EXT)) {
        return {key: "cvUpload.validation.invalidFormat"};
    }
    if (file.size > maxBytes) {
        return {key: "cvUpload.validation.tooLarge", options: {mb: (maxBytes / (1024 * 1024)).toFixed(0)}};
    }
    return null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Localized size: "2.0 MB" in English, "2,0 Mo" in French. Pass the current language. */
export function formatBytes(bytes, lang = "en") {
    const unit = bytes < 1024 ? "byte" : bytes < 1024 * 1024 ? "kilobyte" : "megabyte";
    const value = unit === "byte" ? bytes : unit === "kilobyte" ? bytes / 1024 : bytes / (1024 * 1024);
    return new Intl.NumberFormat(lang, {
        style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 1,
    }).format(value);
}

/** en-CA renders dates as YYYY-MM-DD (language-neutral on purpose) */
export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-CA");

/** Sort CVDto array newest-first */
export const sortDocs = (list) =>
    [...list].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

// ─── Blob / PDF helpers ───────────────────────────────────────────────────────

/** Caller must call URL.revokeObjectURL(url) when done. */
export function base64ToBlobUrl(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], {type: ACCEPTED_MIME}));
}