// File helpers shared by the portfolio, the manager CV review and the employer pages.

// ─── File constraints ─────────────────────────────────────────────────────────

export const FALLBACK_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_MIME = "application/pdf";
export const ACCEPTED_EXT = ".pdf";

/** Bytes → whole megabytes, as a NUMBER (never a string). */
export const bytesToMb = (bytes) => Math.round(bytes / (1024 * 1024));

/** Returns { key, options } for t() when the file is invalid, or null when acceptable. */
export function validateFile(file, maxBytes = FALLBACK_MAX_BYTES) {
    if (!file) return {key: "portfolio.validation.noFile"};
    if (file.type !== ACCEPTED_MIME && !file.name.toLowerCase().endsWith(ACCEPTED_EXT)) {
        return {key: "portfolio.validation.invalidFormat"};
    }
    if (file.size > maxBytes) {
        return {key: "portfolio.validation.tooLarge", options: {mb: bytesToMb(maxBytes)}};
    }
    return null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Localized size: "2.0 MB" in English, "2,0 Mo" in French. Pass the current language. */
export function formatBytes(bytes, lang = "en") {
    const unit = bytes < 1024 ? "byte" : bytes < 1024 * 1024 ? "kilobyte" : "megabyte";
    const value = unit === "byte" ? bytes : unit === "kilobyte" ? bytes / 1024 : bytes / (1024 * 1024);
    const options = {style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 1};

    return new Intl.NumberFormat(lang, options).format(value);
}

/** en-CA renders dates as YYYY-MM-DD (language-neutral on purpose) */
export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-CA");

// ─── Blob / PDF helpers ───────────────────────────────────────────────────────

function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/** Caller must call URL.revokeObjectURL(url) when done. */
export function base64ToBlobUrl(b64) {
    return URL.createObjectURL(new Blob([base64ToBytes(b64)], {type: ACCEPTED_MIME}));
}

/** Base64 PDF → File (used to re-upload a stored document under another type). */
export function base64ToFile(b64, fileName) {
    return new File([base64ToBytes(b64)], fileName, {type: ACCEPTED_MIME});
}

/** API file {content: Base64} → blob: URL. Throws when the content is missing. */
export function blobUrlFromFile(file) {
    if (!file?.content) throw new Error("missing content");
    return base64ToBlobUrl(file.content);
}
