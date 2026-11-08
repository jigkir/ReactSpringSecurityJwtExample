import {useTranslation} from "react-i18next";
import {useSession} from "../../utils/useSession.js";

// Session selector shared by the navbar and the mobile sidebar
export default function SessionSelect({className, errorClassName}) {
    const {t} = useTranslation();
    const {sessions, selectedSession, setSelectedSession, sessionsLoadFailed} = useSession();

    if (sessionsLoadFailed) {
        return <p role="alert" className={errorClassName}>{t("navbar.sessionsLoadError")}</p>;
    }

    const selectSession = (event) => {
        setSelectedSession(sessions.find((session) => session.name === event.target.value) ?? null);
    };

    return (
        <select
            aria-label={t("navbar.sessionSelector")}
            value={selectedSession?.name ?? ""}
            onChange={selectSession}
            className={className}
        >
            {sessions.map((session) => (
                <option key={session.id} value={session.name}>{session.name}</option>
            ))}
        </select>
    );
}