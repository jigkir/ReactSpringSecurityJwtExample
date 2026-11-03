import {useCallback, useEffect, useRef, useState} from 'react';
import {getApplicationCv} from '../components/api/Api.jsx';

const UNREAD = "UNREAD";

export function useNewApplications() {
    const unreadAtLoad = useRef(new Map()); // application id -> was new when first seen
    const sentToServer = useRef(new Set()); // ids already marked as read on the server
    const [version, setVersion] = useState(0);

    const markAsRead = useCallback((id) => {
        if (sentToServer.current.has(id)) return;
        sentToServer.current.add(id);
        Promise.resolve(getApplicationCv(id)).catch(() => {
            sentToServer.current.delete(id);
        });
    }, []);

    const register = useCallback((list) => {
        for (const app of list ?? []) {
            if (!unreadAtLoad.current.has(app.id)) {
                unreadAtLoad.current.set(app.id, app.internshipApplicationStatus === UNREAD);
            }
        }
    }, []);

    const isNew = useCallback(
        (app) => unreadAtLoad.current.get(app.id) ?? app.internshipApplicationStatus === UNREAD,
        [],
    );

    const clear = useCallback((id) => {
        markAsRead(id);
        if (unreadAtLoad.current.get(id)) {
            unreadAtLoad.current.set(id, false);
            setVersion((v) => v + 1);
        }
    }, [markAsRead]);

    // Leaving the page: everything still "new" becomes read
    useEffect(() => () => {
        for (const [id, wasNew] of unreadAtLoad.current) {
            if (wasNew) markAsRead(id);
        }
    }, [markAsRead]);

    return {register, isNew, clear, version};
}