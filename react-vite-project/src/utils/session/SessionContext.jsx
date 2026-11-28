
import {createContext, useCallback, useEffect, useMemo, useState} from "react";
import {getSessions} from "../../components/shared/core/api/Api.jsx";
import {usePolling} from "../hooks/usePolling.js";

export const SessionContext = createContext(null);

const findTargetSession = (sessions) => sessions.find((session) => session.target) ?? null;



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
