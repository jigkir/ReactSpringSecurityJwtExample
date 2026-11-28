
export function i18nError(key, options) {
    const err = new Error(key);
    err.i18n = {key, options};
    return err;
}
