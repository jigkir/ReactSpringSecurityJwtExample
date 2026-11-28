import mergeHeaders from "../tracking/mergeheader.js";
import BASE_URL from "../../components/shared/core/config/Config.jsx";
import i18n from "../../i18next.jsx"

async function fetcher(input, options) {

    const currentLang = i18n.resolvedLanguage || i18n.language;
    const token = localStorage.getItem("token");
    const defaultHeaders = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept-Language': currentLang,
    };
    const headers = mergeHeaders(defaultHeaders, options?.headers);

    const fetchOptions = {...options, headers};

    try {
        input = input.replace(/^\//, "");
        const url = BASE_URL + input;

        const response = await fetch(`${BASE_URL}${input}`, fetchOptions);

        return response;
    } catch (e) {
        throw e;
    }

}

export default fetcher;
