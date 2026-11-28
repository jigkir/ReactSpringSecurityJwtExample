



export const FALLBACK_MAX_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_MIME = "application/pdf";
export const ACCEPTED_EXT = ".pdf";


export const bytesToMb = (bytes) => Math.round(bytes / (1024 * 1024));


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




export function formatBytes(bytes, lang = "en") {
    const unit = bytes < 1024 ? "byte" : bytes < 1024 * 1024 ? "kilobyte" : "megabyte";
    const value = unit === "byte" ? bytes : unit === "kilobyte" ? bytes / 1024 : bytes / (1024 * 1024);
    const options = {style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 1};

    return new Intl.NumberFormat(lang, options).format(value);
}


export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-CA");



function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}


export function base64ToBlobUrl(b64) {
    return URL.createObjectURL(new Blob([base64ToBytes(b64)], {type: ACCEPTED_MIME}));
}


export function base64ToFile(b64, fileName) {
    return new File([base64ToBytes(b64)], fileName, {type: ACCEPTED_MIME});
}


export function blobUrlFromFile(file) {
    if (!file?.content) throw new Error("missing content");
    return base64ToBlobUrl(file.content);
}



const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/g;


const toFilePart = (text) =>
    String(text).replace(ILLEGAL_FILENAME_CHARS, "").trim().replace(/\s+/g, "_");



export function buildFileName({language, docType, studentName, originalName}) {
    const extension = originalName?.includes(".") ? originalName.split(".").pop() : "pdf";
    const base = [language?.toLowerCase(), docType, studentName]
        .filter(Boolean)
        .map(toFilePart)
        .join("-");
    return `${base}.${extension}`;
}


export function saveFile(file, fileName = file.fileName) {
    const url = blobUrlFromFile(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
