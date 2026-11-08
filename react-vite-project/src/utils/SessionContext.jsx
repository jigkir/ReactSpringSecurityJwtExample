// src/utils/SessionContext.jsx
import {createContext, useCallback, useEffect, useMemo, useState} from "react";
import {getSessions} from "../components/api/Api.jsx";
import {usePolling} from "./usePolling.js";

export const SessionContext = createContext(null);

const findTargetSession = (sessions) => sessions.find((session) => session.target) ?? null;

/**
 * Sessions of the logged-in user and the session chosen in the navbar.
 * Each login starts on the target session (the one students look for an internship for),
 * so a user never keeps the session chosen by the previous user of the browser.
 */
export function SessionProvider({userId, children}) {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionsLoadFailed, setSessionsLoadFailed] = useState(false);

    const loadSessions = useCallback(async () => {
        try {
            const {sessions: loadedSessions} = await getSessions();
            setSessions(loadedSessions);
            setSessionsLoadFailed(false);
            return loadedSessions;
        } catch {
            setSessionsLoadFailed(true);
            return [];
        }
    }, []);

    useEffect(() => {
        setSessions([]);
        setSelectedSession(null);
        if (!userId) return;

        let cancelled = false;
        loadSessions().then((loadedSessions) => {
            if (!cancelled) setSelectedSession(findTargetSession(loadedSessions));
        });

        return () => {
            cancelled = true;
        };
    }, [userId, loadSessions]);

    // The next target session (created once the winter is over) appears without logging in again
    usePolling(loadSessions, Boolean(userId));

    const value = useMemo(
        () => ({
            sessions,
            targetSession: findTargetSession(sessions),
            selectedSession,
            setSelectedSession,
            sessionsLoadFailed
        }),
        [sessions, selectedSession, sessionsLoadFailed],
    );

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}