import mergeHeaders from "./mergeheader";
import BASE_URL from "../components/config/Config.jsx";
import i18n from "../i18next.jsx"

async function fetcher(input, options) {
    // your headers
    const currentLang = i18n.resolvedLanguage || i18n.language;
    const token = localStorage.getItem("token");
    const defaultHeaders = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept-Language': currentLang,
    };
    const headers = mergeHeaders(defaultHeaders, options?.headers);
    // merge the options with the headers
    const fetchOptions = {...options, headers};
    // fetch
    try {
        input = input.replace(/^\//, "");
        const url = BASE_URL + input;
        // console.log("Fetching:", url, "with options:", fetchOptions);
        const response = await fetch(`${BASE_URL}${input}`, fetchOptions);
        // console.log("Response status:", response.status);
        return response;
    } catch (e) {
        throw e;
    }

}

export default fetcher;
