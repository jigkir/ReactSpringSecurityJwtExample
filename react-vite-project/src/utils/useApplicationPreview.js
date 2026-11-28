import {useCallback, useEffect, useMemo, useState} from "react";
import {useNewApplications} from "./useNewApplications.js";
import {blobUrlFromFile} from "./Documents.js";

export function useApplicationPreview({items, dark, handleSeen, getUrl, targetType}) {
    const [preview, setPreview] = useState(null);
    const openPreview = useCallback((value) => setPreview(value), []);
    const closePreview = useCallback(() => setPreview(null), []);
    const newApplications = useNewApplications(items, handleSeen);
    const resolvedUrl = useMemo(() => preview ? getUrl(preview) : null, [preview, getUrl]);
    return {preview, openPreview, closePreview, newApplications, resolvedUrl};
}
