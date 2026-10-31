export const DOC_TYPES = {
    CV: {labelKey: "portfolio.types.CV"},
    COVER_LETTER: {labelKey: "portfolio.types.COVER_LETTER"},
    TRANSCRIPT: {labelKey: "portfolio.types.TRANSCRIPT"},
};
export const DOC_TYPE_KEYS = Object.keys(DOC_TYPES);

// Best guess from the file name; the student can change it in the upload panel
export function guessDocType(fileName = "") {
    const n = fileName.toLowerCase();
    if (/(lettre|motivation|cover|letter)/.test(n)) return "COVER_LETTER";
    if (/(relev|transcript|bulletin)/.test(n)) return "TRANSCRIPT";
    return "CV";
}